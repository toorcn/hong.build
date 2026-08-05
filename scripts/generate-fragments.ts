/**
 * Build-time anamorphosis generator.
 *
 * For each vantage k:
 *   1. Rasterize the silhouette SVG to an alpha mask (sharp).
 *   2. Rejection-sample M points in the mask, mapped to NDC.
 *   3. Define the alignment camera Pk (spherical position, looks at origin).
 *   4. Unproject each sample through Pk to get a ray, then place the
 *      fragment at a RANDOM DEPTH along that ray.
 *
 * From Pk every fragment lands exactly on the silhouette. From any other
 * angle the depth jitter scatters them into noise.
 *
 * Output: public/fragments.bin + lib/generated/fragments-meta.ts
 *
 * Run: npx tsx scripts/generate-fragments.ts [--check]
 *   --check renders the five vantages plus off-axis views to public/preview/
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PerspectiveCamera, Vector3 } from "three";
import { SILHOUETTES } from "../assets/silhouettes";
import {
  CAMERA_DISTANCE,
  CAMERA_FOV,
  SCENE_RADIUS,
  VANTAGE_COUNT,
  VANTAGES,
  vantageCameraPosition,
} from "../lib/vantages";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** Fragments per silhouette on desktop; mobile draws a fraction of these. */
const SAMPLES_PER_VANTAGE = 2400;
/** Seeded PRNG so regenerating never changes the scene for visitors. */
const SEED = 1337;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function rasterizeMask(svg: string): Promise<{ data: Buffer; size: number }> {
  const size = 1024;
  const png = await sharp(Buffer.from(svg), { density: 300 })
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Keep only the alpha channel.
  const alpha = Buffer.alloc(size * size);
  for (let i = 0; i < size * size; i++) {
    alpha[i] = png.data[i * 4 + 3] ?? 0;
  }
  return { data: alpha, size };
}

/** Rejection-sample count points from the mask, returned as NDC in [-1, 1]. */
function sampleMask(mask: Buffer, size: number, count: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 2);
  let placed = 0;
  while (placed < count) {
    const x = rand();
    const y = rand();
    const px = Math.floor(x * size);
    const py = Math.floor(y * size);
    if ((mask[py * size + px] ?? 0) > 16) {
      // NDC: x right, y up. SVG y grows downward.
      out[placed * 2] = x * 2 - 1;
      out[placed * 2 + 1] = 1 - y * 2;
      placed++;
    }
  }
  return out;
}

interface Generated {
  positions: Float32Array;
  vantageIds: Uint8Array;
  seeds: Float32Array;
}

function generate(): Generated {
  const total = SAMPLES_PER_VANTAGE * VANTAGE_COUNT;
  const positions = new Float32Array(total * 3);
  const vantageIds = new Uint8Array(total);
  const seeds = new Float32Array(total);
  const rand = mulberry32(SEED);

  let cursor = 0;
  for (const vantage of VANTAGES) {
    const camPos = vantageCameraPosition(vantage);
    const P = new Vector3(camPos.x, camPos.y, camPos.z);
    const cam = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    cam.position.copy(P);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();

    const { data: mask, size } = masks[vantage.id]!;
    const samples = sampleMask(mask, size, SAMPLES_PER_VANTAGE, rand);

    for (let i = 0; i < SAMPLES_PER_VANTAGE; i++) {
      const ndcX = samples[i * 2]! * 0.86; // leave margin so silhouettes breathe in frame
      const ndcY = samples[i * 2 + 1]! * 0.86;

      // Ray from camera through this NDC point.
      const origin = P;
      const dir = new Vector3(ndcX, ndcY, 0.5)
        .unproject(cam)
        .sub(origin)
        .normalize();

      // Place at random depth so off-axis views dissolve into noise.
      const depth = CAMERA_DISTANCE + (rand() * 2 - 1) * SCENE_RADIUS * 0.85;
      const point = origin.clone().addScaledVector(dir, depth);

      positions[cursor * 3] = point.x;
      positions[cursor * 3 + 1] = point.y;
      positions[cursor * 3 + 2] = point.z;
      vantageIds[cursor] = vantage.id;
      seeds[cursor] = rand();
      cursor++;
    }
  }

  return { positions, vantageIds, seeds };
}

/** Merge 8-bit vantage ids + 16-bit quantized positions + 8-bit seeds into one binary. */
function serialize(g: Generated): Buffer {
  const total = g.vantageIds.length;
  const posBytes = Buffer.from(g.positions.buffer, g.positions.byteOffset, g.positions.byteLength);
  const idBytes = Buffer.from(g.vantageIds.buffer, g.vantageIds.byteOffset, g.vantageIds.byteLength);
  const seedBytes = Buffer.from(g.seeds.buffer, g.seeds.byteOffset, g.seeds.byteLength);

  const header = Buffer.alloc(16);
  header.writeUInt32LE(0x46524147, 0); // "FRAG"
  header.writeUInt32LE(1, 4); // version
  header.writeUInt32LE(total, 8); // instance count
  header.writeUInt32LE(SAMPLES_PER_VANTAGE, 12);
  return Buffer.concat([header, posBytes, idBytes, seedBytes]);
}

// --- mask cache, populated in main ---
const masks: { data: Buffer; size: number }[] = [];

async function main(): Promise<void> {
  const check = process.argv.includes("--check");

  for (let i = 0; i < VANTAGE_COUNT; i++) {
    masks[i] = await rasterizeMask(SILHOUETTES[i]!);
  }

  const generated = generate();
  const bin = serialize(generated);

  mkdirSync(join(ROOT, "public"), { recursive: true });
  writeFileSync(join(ROOT, "public", "fragments.bin"), bin);

  mkdirSync(join(ROOT, "lib", "generated"), { recursive: true });
  writeFileSync(
    join(ROOT, "lib", "generated", "fragments-meta.ts"),
    `// Generated by scripts/generate-fragments.ts — do not edit.
export const FRAGMENT_TOTAL = ${generated.vantageIds.length};
export const FRAGMENTS_PER_VANTAGE = ${SAMPLES_PER_VANTAGE};
`,
  );

  console.log(
    `fragments.bin written: ${generated.vantageIds.length} instances ` +
      `(${SAMPLES_PER_VANTAGE} per vantage x ${VANTAGE_COUNT}), ${(bin.length / 1024).toFixed(1)} KiB`,
  );

  if (check) {
    const { renderChecks } = await import("./render-checks");
    await renderChecks(generated.positions, generated.vantageIds);
  }
}

void main();
