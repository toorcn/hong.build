/**
 * Legibility proof for the narrative morph.
 *
 * Loads public/fragments.bin (v2 layout) and renders:
 *   - each beat resolved (silhouette must read, accent colored)
 *   - a midpoint dissolve between beat 0 and 1 (should read as scatter)
 *
 * CPU rasterization, no GPU. Output: public/preview/morph-*.png
 *
 * Run: npx tsx scripts/render-morph-checks.ts
 */

import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import { BEATS } from "../lib/story";
import { CAMERA_FOV } from "../lib/vantages";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const W = 800;
const H = 800;
const BG: [number, number, number] = [10, 11, 13];
const ACCENT: [number, number, number] = [200, 255, 77];
const SLATE: [number, number, number] = [74, 84, 104];

function load() {
  const buf = readFileSync(join(ROOT, "public", "fragments.bin"));
  const count = buf.readUInt32LE(8);
  const beats = buf.readUInt32LE(12);
  const headerBytes = 16;
  const targetBytes = beats * count * 3 * 4;
  const targets = new Float32Array(
    buf.buffer.slice(buf.byteOffset + headerBytes, buf.byteOffset + headerBytes + targetBytes),
  );
  const noiseOffset = headerBytes + targetBytes;
  const noise = new Float32Array(
    buf.buffer.slice(buf.byteOffset + noiseOffset, buf.byteOffset + noiseOffset + count * 3 * 4),
  );
  return { count, beats, targets, noise };
}

function render(
  positions: Float32Array,
  count: number,
  azimuthDeg: number,
  elevationDeg: number,
  distance: number,
  color: [number, number, number],
): Buffer {
  const img = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    img[i * 3] = BG[0];
    img[i * 3 + 1] = BG[1];
    img[i * 3 + 2] = BG[2];
  }
  const cam = new PerspectiveCamera(CAMERA_FOV, W / H, 0.1, 400);
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  cam.position.set(
    distance * Math.cos(el) * Math.sin(az),
    distance * Math.sin(el),
    distance * Math.cos(el) * Math.cos(az),
  );
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();
  const viewProj = new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const v = new Vector3();
  for (let i = 0; i < count; i++) {
    v.set(positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!).applyMatrix4(viewProj);
    if (v.z < -1 || v.z > 1) continue;
    const sx = Math.round(((v.x + 1) / 2) * W);
    const sy = Math.round(((1 - v.y) / 2) * H);
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
    const idx = (sy * W + sx) * 3;
    img[idx] = color[0];
    img[idx + 1] = color[1];
    img[idx + 2] = color[2];
  }
  return img;
}

function beatPositions(targets: Float32Array, count: number, beat: number): Float32Array {
  const out = new Float32Array(count * 3);
  const off = beat * count * 3;
  out.set(targets.subarray(off, off + count * 3));
  return out;
}

async function main(): Promise<void> {
  const { count, targets, noise } = load();
  const outDir = join(ROOT, "public", "preview");
  mkdirSync(outDir, { recursive: true });

  // Resolved beats.
  for (const beat of BEATS) {
    const pos = beatPositions(targets, count, beat.id);
    const img = render(pos, count, beat.azimuthDeg, beat.elevationDeg, beat.distance, ACCENT);
    await sharp(img, { raw: { width: W, height: H, channels: 3 } })
      .png()
      .toFile(join(outDir, `morph-beat-${beat.id}.png`));
    console.log(`rendered morph-beat-${beat.id}.png (${beat.label})`);
  }

  // Midpoint dissolve between beat 0 and 1 (position + noise mix).
  const a = beatPositions(targets, count, 0);
  const b = beatPositions(targets, count, 1);
  const mid = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    const base = (a[i]! + b[i]!) / 2;
    mid[i] = base + noise[i]! * 0.9;
  }
  const beat0 = BEATS[0]!;
  const beat1 = BEATS[1]!;
  const midAz = (beat0.azimuthDeg + beat1.azimuthDeg) / 2;
  const midEl = (beat0.elevationDeg + beat1.elevationDeg) / 2;
  const midDist = (beat0.distance + beat1.distance) / 2;
  const dissolve = render(mid, count, midAz, midEl, midDist, SLATE);
  await sharp(dissolve, { raw: { width: W, height: H, channels: 3 } })
    .png()
    .toFile(join(outDir, "morph-dissolve.png"));
  console.log("rendered morph-dissolve.png");
}

void main();
