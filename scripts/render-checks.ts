/**
 * Legibility proof for the anamorphosis.
 *
 * Renders, with CPU rasterization (no GPU, runs anywhere):
 *   - each of the five vantages from its exact alignment camera
 *     (silhouette must read crisply, colored by vantage)
 *   - two off-axis views per vantage: ±18° azimuth
 *     (should read as scattered noise)
 *
 * Output: public/preview/v{k}.png, public/preview/off-{k}-{plus|minus}.png
 */

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import { CAMERA_DISTANCE, CAMERA_FOV, VANTAGES } from "../lib/vantages";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const W = 800;
const H = 800;
const BG: [number, number, number] = [10, 11, 13]; // #0A0B0D
const ACCENT: [number, number, number] = [200, 255, 77]; // #C8FF4D
const SLATE: [number, number, number] = [74, 84, 104];

function renderView(
  positions: Float32Array,
  vantageIds: Uint8Array,
  azimuthDeg: number,
  elevationDeg: number,
  highlightVantage: number | null,
): Buffer {
  const img = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    img[i * 3] = BG[0];
    img[i * 3 + 1] = BG[1];
    img[i * 3 + 2] = BG[2];
  }

  const cam = new PerspectiveCamera(CAMERA_FOV, W / H, 0.1, 200);
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  cam.position.set(
    CAMERA_DISTANCE * Math.cos(el) * Math.sin(az),
    CAMERA_DISTANCE * Math.sin(el),
    CAMERA_DISTANCE * Math.cos(el) * Math.cos(az),
  );
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();

  const viewProj = new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const v = new Vector3();

  const total = vantageIds.length;
  for (let i = 0; i < total; i++) {
    v.set(positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!).applyMatrix4(viewProj);
    if (v.z < -1 || v.z > 1) continue; // behind camera or beyond far plane
    const sx = Math.round(((v.x + 1) / 2) * W);
    const sy = Math.round(((1 - v.y) / 2) * H);
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;

    const isHighlight = highlightVantage !== null && vantageIds[i] === highlightVantage;
    const color = isHighlight ? ACCENT : SLATE;
    const idx = (sy * W + sx) * 3;
    img[idx] = color[0];
    img[idx + 1] = color[1];
    img[idx + 2] = color[2];
  }
  return img;
}

async function savePng(img: Buffer, file: string): Promise<void> {
  await sharp(img, { raw: { width: W, height: H, channels: 3 } })
    .png()
    .toFile(file);
}

export async function renderChecks(positions: Float32Array, vantageIds: Uint8Array): Promise<void> {
  const outDir = join(ROOT, "public", "preview");
  mkdirSync(outDir, { recursive: true });

  for (const vantage of VANTAGES) {
    // Resolved view from the exact alignment camera.
    const resolved = renderView(
      positions,
      vantageIds,
      vantage.azimuthDeg,
      vantage.elevationDeg,
      vantage.id,
    );
    const file = join(outDir, `v${vantage.id}.png`);
    await savePng(resolved, file);
    console.log(`rendered v${vantage.id}.png (${vantage.code} ${vantage.label})`);
  }

  // Two off-axis views around V0 to prove the dissolve.
  const v0 = VANTAGES[0]!;
  for (const [label, delta] of [
    ["minus", -18],
    ["plus", 18],
  ] as const) {
    const view = renderView(positions, vantageIds, v0.azimuthDeg + delta, v0.elevationDeg, 0);
    const file = join(outDir, `off-0-${label}.png`);
    await savePng(view, file);
    console.log(`rendered off-0-${label}.png`);
  }
}
