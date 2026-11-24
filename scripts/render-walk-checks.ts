/**
 * Legibility proof for the walk (v3).
 *
 * Loads public/fragments.bin (v3 layout) and renders:
 *   - each room's artifact from its approach pose (must read, accent)
 *   - a mid-corridor frame (past ghost relaxing + next room still dust)
 *   - a look-back frame (history stays standing behind the camera)
 *
 * CPU rasterization, no GPU. Output: public/preview/walk-*.png
 *
 * Run: npx tsx scripts/render-morph-checks.ts
 */

import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PerspectiveCamera, Vector3 } from "three";
import { BEATS, ROOMS, BEAT_T, approachPose, pathPose, pathLook } from "../lib/story";
import { CAMERA_FOV } from "../lib/vantages";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const W = 800;
const H = 800;
const BG: [number, number, number] = [10, 11, 13];
const ACCENT: [number, number, number] = [200, 255, 77];
const SLATE: [number, number, number] = [74, 84, 104];
const DIM: [number, number, number] = [44, 50, 62];

function load() {
  const buf = readFileSync(join(ROOT, "public", "fragments.bin"));
  const version = buf.readUInt32LE(4);
  if (version !== 3) throw new Error(`expected v3 fragments, got v${version}`);
  const count = buf.readUInt32LE(8);
  const headerBytes = 16;
  const vecBytes = count * 3 * 4;
  const fBytes = count * 4;
  const slice = (off: number, len: number) =>
    new Float32Array(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + len));
  const targets = slice(headerBytes, vecBytes);
  const dust = slice(headerBytes + vecBytes, vecBytes);
  const homes = slice(headerBytes + vecBytes * 2 + fBytes, fBytes);
  return { count, targets, dust, homes };
}

/** Fragment world positions at a storyT, mirroring the shader's model. */
function positionsAt(
  t: number,
  data: { count: number; targets: Float32Array; dust: Float32Array; homes: Float32Array },
): { pos: Float32Array; kind: Uint8Array } {
  const { count, targets, dust, homes } = data;
  const pos = new Float32Array(count * 3);
  const kind = new Uint8Array(count); // 0 dust, 1 resolved, 2 ghost
  for (let i = 0; i < count; i++) {
    const home = homes[i]!;
    const bt = BEAT_T[home]!;
    const prev = home === 0 ? -1 : BEAT_T[home - 1]!;
    const gatherStart = home === 0 ? -1 : (prev + bt) / 2;
    const gs = Math.min(Math.max((t - gatherStart) / Math.max(bt - gatherStart, 1e-6), 0), 1);
    const r = gs * gs * (3 - 2 * gs);
    const next = home === BEAT_T.length - 1 ? 2 : BEAT_T[home + 1]!;
    const ghostEnd = (bt + next) / 2;
    const gg = Math.min(Math.max((t - bt) / Math.max(ghostEnd - bt, 1e-6), 0), 1);
    const ghost = gg * gg * (3 - 2 * gg);
    const relax = ghost * 0.35;
    for (let c = 0; c < 3; c++) {
      const target = targets[i * 3 + c]!;
      const du = dust[i * 3 + c]!;
      const resolved = du + (target - du) * r;
      pos[i * 3 + c] = resolved + (du - resolved) * relax;
    }
    kind[i] = r < 0.5 ? 0 : ghost > 0.5 ? 2 : 1;
  }
  return { pos, kind };
}

function render(
  pos: Float32Array,
  kind: Uint8Array,
  count: number,
  eye: { x: number; y: number; z: number },
  look: { x: number; y: number; z: number },
): Buffer {
  const img = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    img[i * 3] = BG[0];
    img[i * 3 + 1] = BG[1];
    img[i * 3 + 2] = BG[2];
  }
  const cam = new PerspectiveCamera(CAMERA_FOV, W / H, 0.1, 800);
  cam.position.set(eye.x, eye.y, eye.z);
  cam.lookAt(look.x, look.y, look.z);
  cam.updateMatrixWorld();
  const v = new Vector3();
  const view = new Vector3();
  const COLORS = [DIM, ACCENT, SLATE] as const;
  for (let i = 0; i < count; i++) {
    view.set(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!).applyMatrix4(cam.matrixWorldInverse);
    if (view.z > -0.1) continue; // behind the camera — perspective divide would mirror it
    v.copy(view).applyMatrix4(cam.projectionMatrix);
    if (v.z < -1 || v.z > 1) continue;
    const sx = Math.round(((v.x + 1) / 2) * W);
    const sy = Math.round(((1 - v.y) / 2) * H);
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
    const color = COLORS[kind[i]!]!;
    const idx = (sy * W + sx) * 3;
    img[idx] = color[0];
    img[idx + 1] = color[1];
    img[idx + 2] = color[2];
  }
  return img;
}

async function main(): Promise<void> {
  const data = load();
  const outDir = join(ROOT, "public", "preview");
  mkdirSync(outDir, { recursive: true });

  // Each room's hero: artifact resolved, seen from its approach pose.
  for (const beat of BEATS) {
    const { pos, kind } = positionsAt(BEAT_T[beat.id]!, data);
    // Only this room's fragments, so the render isolates the silhouette.
    for (let i = 0; i < data.count; i++) {
      if (data.homes[i] !== beat.id) kind[i] = 0;
    }
    const eye = approachPose(beat.id);
    const [lx, ly, lz] = ROOMS[beat.id]!.center;
    const img = render(pos, kind, data.count, eye, { x: lx, y: ly, z: lz });
    await sharp(img, { raw: { width: W, height: H, channels: 3 } })
      .png()
      .toFile(join(outDir, `walk-room-${beat.id}.png`));
    console.log(`rendered walk-room-${beat.id}.png (${beat.label})`);
  }

  // Mid-corridor between rooms 0 and 1: the gate ghosts, the tally is dust.
  const t = (BEAT_T[0]! + BEAT_T[1]!) / 2;
  const { pos, kind } = positionsAt(t, data);
  const img = render(pos, kind, data.count, pathPose(t), pathLook(t));
  await sharp(img, { raw: { width: W, height: H, channels: 3 } })
    .png()
    .toFile(join(outDir, "walk-corridor.png"));
  console.log("rendered walk-corridor.png");

  // Look-back from the corridor between rooms 1 and 2: rooms 0 and 1 must
  // still be standing behind.
  const t2 = (BEAT_T[1]! + BEAT_T[2]!) / 2;
  const back = positionsAt(t2, data);
  const eye2 = pathPose(t2);
  const [bx, by, bz] = ROOMS[0]!.center;
  const img2 = render(back.pos, back.kind, data.count, eye2, { x: bx, y: by, z: bz });
  await sharp(img2, { raw: { width: W, height: H, channels: 3 } })
    .png()
    .toFile(join(outDir, "walk-lookback.png"));
  console.log("rendered walk-lookback.png");
}

void main();
