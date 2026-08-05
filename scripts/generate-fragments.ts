/**
 * Build-time generator for the walk (v3).
 *
 * One pool of N fragments, each with a HOME chapter. A fragment only ever
 * belongs to one artifact — there is no morph. Each beat's allocation is
 * sampled into its silhouette, placed at its room centre; the same
 * fragment's dust position is a point in the room's shell, where it lives
 * until the camera nears and the shader gathers it in. Past rooms, the
 * fragment relaxes back toward its dust — history becomes the walls.
 *
 * Per fragment, generated here:
 *   - home:   which beat it belongs to (f32 for the attribute)
 *   - target: world-space resolved position in its artifact
 *   - dust:   world-space ambient position in its room's shell
 *   - seed:   random 0..1 for stagger and drift
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
import {
  BEATS,
  BEAT_ALLOCATIONS,
  BEAT_COUNT,
  ROOMS,
  beatPose,
  beatT,
  fidelity,
} from "../lib/story";
import { CAMERA_FOV } from "../lib/vantages";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/**
 * Fragments in the shared pool. Raised from 6,000 when the journey went from
 * seven chapters to eleven — the per-chapter allocations were getting too thin
 * to keep a silhouette legible. Costs ~32 bytes per fragment in fragments.bin.
 */
const FRAGMENT_COUNT = 7000;
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
  /** World-space resolved positions: count*3. */
  targets: Float32Array;
  /** World-space ambient dust positions: count*3. */
  dust: Float32Array;
  /** Per-fragment random seed for stagger and drift. */
  seeds: Float32Array;
  /** Per-fragment home beat, stored as f32 for the attribute. */
  homes: Float32Array;
}

function generate(): Generated {
  const allocTotal = BEAT_ALLOCATIONS.reduce((a, b) => a + b, 0);
  if (allocTotal !== FRAGMENT_COUNT) {
    throw new Error(`BEAT_ALLOCATIONS sums to ${allocTotal}, expected ${FRAGMENT_COUNT}`);
  }

  const rand = mulberry32(SEED);

  // Generate per-beat blocks first…
  const perBeat = Array.from({ length: BEAT_COUNT }, () => ({
    targets: [] as number[],
    dust: [] as number[],
    seeds: [] as number[],
  }));

  for (let k = 0; k < BEAT_COUNT; k++) {
    const beat = BEATS[k]!;
    const room = ROOMS[k]!;
    const count = BEAT_ALLOCATIONS[k]!;
    const mask = masks[beat.silhouette]!;
    const block = perBeat[k]!;

    // The artifact is formed exactly as the old morph generator formed it —
    // sampled through the beat's authored camera around the origin — then
    // translated to its room. The authored angles survive the walk.
    const pose = beatPose(beat);
    const P = new Vector3(pose.x, pose.y, pose.z);
    const cam = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
    cam.position.copy(P);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();

    const [cx, cy, cz] = room.center;
    // Depth jitter IS the fidelity narrative: the gate scatters coarse
    // (an 18 KB jar by a twelve-year-old), the wordmark sets tight.
    const jitter = 3.4 * (1 - fidelity(beatT(k))) + 0.4;
    for (let i = 0; i < count; i++) {
      const s = sampleOne(mask.data, mask.size, rand);
      const ndcX = s.x * 0.82;
      const ndcY = s.y * 0.82;
      const dir = new Vector3(ndcX, ndcY, 0.5).unproject(cam).sub(P).normalize();
      const depth = beat.distance + (rand() * 2 - 1) * jitter;
      const point = P.clone().addScaledVector(dir, depth);
      block.targets.push(point.x + cx, point.y + cy, point.z + cz);

      // The room's walls: most dust hugs the shell, some floats inside.
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      const wall = rand() < 0.7;
      const r = wall
        ? room.radius * (0.8 + rand() * 0.35)
        : room.radius * (0.25 + rand() * 0.55);
      block.dust.push(
        cx + r * Math.sin(phi) * Math.cos(theta),
        cy + r * Math.sin(phi) * Math.sin(theta),
        cz + r * Math.cos(phi),
      );

      block.seeds.push(rand());
    }
  }

  // …then interleave blocks round-robin. The runtime trims drawRange on
  // mobile, and an interleaved order means truncation thins every room
  // evenly instead of amputating the final chapters.
  const targets = new Float32Array(FRAGMENT_COUNT * 3);
  const dust = new Float32Array(FRAGMENT_COUNT * 3);
  const seeds = new Float32Array(FRAGMENT_COUNT);
  const homes = new Float32Array(FRAGMENT_COUNT);
  let out = 0;
  for (let i = 0; out < FRAGMENT_COUNT; i++) {
    for (let k = 0; k < BEAT_COUNT && out < FRAGMENT_COUNT; k++) {
      const block = perBeat[k]!;
      if (i * 3 >= block.targets.length) continue;
      targets.set(block.targets.slice(i * 3, i * 3 + 3), out * 3);
      dust.set(block.dust.slice(i * 3, i * 3 + 3), out * 3);
      seeds[out] = block.seeds[i]!;
      homes[out] = k;
      out++;
    }
  }

  return { targets, dust, seeds, homes };
}

function serialize(g: Generated): Buffer {
  const header = Buffer.alloc(16);
  header.writeUInt32LE(0x46524147, 0); // "FRAG"
  header.writeUInt32LE(3, 4); // version 3 = the walk (home/dust/target/seed)
  header.writeUInt32LE(FRAGMENT_COUNT, 8);
  header.writeUInt32LE(BEAT_COUNT, 12);

  const parts = [g.targets, g.dust, g.seeds, g.homes].map((a) =>
    Buffer.from(a.buffer, a.byteOffset, a.byteLength),
  );
  return Buffer.concat([header, ...parts]);
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
    `fragments.bin (v3 walk) written: ${FRAGMENT_COUNT} fragments across ${BEAT_COUNT} rooms, ` +
      `${(bin.length / 1024).toFixed(1)} KiB`,
  );
}

void main();
