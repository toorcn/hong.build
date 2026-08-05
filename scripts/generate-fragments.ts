/**
 * Build-time narrative anamorphosis generator.
 *
 * One pool of N fragments. Each fragment carries BEAT_COUNT target
 * positions — one resolved position per story beat. The runtime shader
 * morphs each fragment toward the current beat's target, so scrolling
 * dissolves the cloud to noise and re-forms it as the next silhouette.
 *
 * Resolved position for fragment f at beat k:
 *   - rasterize silhouette k to an alpha mask, rejection-sample a 2D point
 *   - map to a plane at the beat's authored camera distance
 *   - jitter depth along the camera ray so off-angle views scatter
 *
 * Between beats the shader interpolates targets, and a per-fragment
 * "noise" vector (also generated here) is mixed in at the midpoint so the
 * dissolve is visible rather than a straight slide.
 *
 * Output: public/fragments.bin + lib/generated/fragments-meta.ts
 *
 * Run: npx tsx scripts/generate-fragments.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PerspectiveCamera, Vector3 } from "three";
import { SILHOUETTES } from "../assets/silhouettes";
import { BEATS, BEAT_COUNT, beatPose } from "../lib/story";
import { CAMERA_FOV } from "../lib/vantages";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** Fragments in the shared pool. */
const FRAGMENT_COUNT = 6000;
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
  const alpha = Buffer.alloc(size * size);
  for (let i = 0; i < size * size; i++) {
    alpha[i] = png.data[i * 4 + 3] ?? 0;
  }
  return { data: alpha, size };
}

function sampleOne(mask: Buffer, size: number, rand: () => number): { x: number; y: number } {
  // Rejection-sample a single point inside the silhouette.
  for (;;) {
    const x = rand();
    const y = rand();
    const px = Math.floor(x * size);
    const py = Math.floor(y * size);
    if ((mask[py * size + px] ?? 0) > 16) {
      return { x: x * 2 - 1, y: 1 - y * 2 };
    }
  }
}

interface Generated {
  /** Per-beat resolved positions: BEAT_COUNT blocks of FRAGMENT_COUNT*3. */
  targets: Float32Array;
  /** Per-fragment noise offset for the dissolve midpoint. */
  noise: Float32Array;
  /** Per-fragment random seed for stagger and drift. */
  seeds: Float32Array;
}

function generate(): Generated {
  const targets = new Float32Array(BEAT_COUNT * FRAGMENT_COUNT * 3);
  const noise = new Float32Array(FRAGMENT_COUNT * 3);
  const seeds = new Float32Array(FRAGMENT_COUNT);
  const rand = mulberry32(SEED);

  // Per-fragment noise vector, on a shell so dissolves read as scatter.
  for (let i = 0; i < FRAGMENT_COUNT; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    const r = 3.5 + rand() * 4.5;
    noise[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    noise[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    noise[i * 3 + 2] = r * Math.cos(phi);
    seeds[i] = rand();
  }

  // Per-beat resolved positions for every fragment.
  for (let k = 0; k < BEAT_COUNT; k++) {
    const beat = BEATS[k]!;
    const mask = masks[beat.silhouette]!;
    const pose = beatPose(beat);
    const P = new Vector3(pose.x, pose.y, pose.z);
    const cam = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
    cam.position.copy(P);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();

    const blockOffset = k * FRAGMENT_COUNT * 3;
    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const s = sampleOne(mask.data, mask.size, rand);
      const ndcX = s.x * 0.82;
      const ndcY = s.y * 0.82;
      const dir = new Vector3(ndcX, ndcY, 0.5).unproject(cam).sub(P).normalize();
      const depth = beat.distance + (rand() * 2 - 1) * 3.4;
      const point = P.clone().addScaledVector(dir, depth);
      targets[blockOffset + i * 3] = point.x;
      targets[blockOffset + i * 3 + 1] = point.y;
      targets[blockOffset + i * 3 + 2] = point.z;
    }
  }

  return { targets, noise, seeds };
}

function serialize(g: Generated): Buffer {
  const header = Buffer.alloc(16);
  header.writeUInt32LE(0x46524147, 0); // "FRAG"
  header.writeUInt32LE(2, 4); // version 2 = narrative morph layout
  header.writeUInt32LE(FRAGMENT_COUNT, 8);
  header.writeUInt32LE(BEAT_COUNT, 12);

  const targetBytes = Buffer.from(g.targets.buffer, g.targets.byteOffset, g.targets.byteLength);
  const noiseBytes = Buffer.from(g.noise.buffer, g.noise.byteOffset, g.noise.byteLength);
  const seedBytes = Buffer.from(g.seeds.buffer, g.seeds.byteOffset, g.seeds.byteLength);
  return Buffer.concat([header, targetBytes, noiseBytes, seedBytes]);
}

const masks: { data: Buffer; size: number }[] = [];

async function main(): Promise<void> {
  // Rasterize every unique silhouette referenced by the beats.
  const uniqueSilhouettes = [...new Set(BEATS.map((b) => b.silhouette))];
  for (const idx of uniqueSilhouettes) {
    masks[idx] = await rasterizeMask(SILHOUETTES[idx]!);
  }

  const generated = generate();
  const bin = serialize(generated);

  mkdirSync(join(ROOT, "public"), { recursive: true });
  writeFileSync(join(ROOT, "public", "fragments.bin"), bin);

  mkdirSync(join(ROOT, "lib", "generated"), { recursive: true });
  writeFileSync(
    join(ROOT, "lib", "generated", "fragments-meta.ts"),
    `// Generated by scripts/generate-fragments.ts — do not edit.
export const FRAGMENT_TOTAL = ${FRAGMENT_COUNT};
export const BEAT_TARGET_COUNT = ${BEAT_COUNT};
`,
  );

  console.log(
    `fragments.bin (v2 narrative) written: ${FRAGMENT_COUNT} fragments x ${BEAT_COUNT} beats, ` +
      `${(bin.length / 1024).toFixed(1)} KiB`,
  );
}

void main();
