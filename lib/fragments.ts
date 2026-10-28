"use client";

import { FRAGMENT_VERSION } from "./generated/fragments-meta";

/**
 * Loads public/fragments.bin (v3 walk layout).
 * Header: magic(4) version(4) count(4) beats(4), then
 *   targets[count*3 f32] + dust[count*3 f32] + seeds[count f32] + homes[count f32].
 *
 * Each fragment has one home beat: it gathers from its room's dust into its
 * artifact as the camera approaches, and relaxes back toward the walls as
 * the walk moves on. No fragment ever becomes a different artifact.
 */

export interface FragmentData {
  count: number;
  beats: number;
  /** World-space resolved positions, count*3. */
  targets: Float32Array;
  /** World-space ambient dust positions, count*3. */
  dust: Float32Array;
  seeds: Float32Array;
  /** Home beat per fragment, stored as f32. */
  homes: Float32Array;
}

let cache: Promise<FragmentData> | null = null;

/** Reported as bytes arrive so the entrance log can show real progress. */
export type ProgressFn = (loaded: number, total: number) => void;

/**
 * Streams the body so the caller can report truthful byte progress. Falls
 * back to a plain arrayBuffer() read when the response isn't streamable or
 * Content-Length is missing (e.g. some dev-server / proxy configurations),
 * in which case progress jumps straight to complete.
 */
async function readWithProgress(res: Response, onProgress?: ProgressFn): Promise<ArrayBuffer> {
  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body || !total) {
    const buf = await res.arrayBuffer();
    onProgress?.(buf.byteLength, buf.byteLength);
    return buf;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.(loaded, total);
  }

  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

export function loadFragments(onProgress?: ProgressFn): Promise<FragmentData> {
  if (cache) return cache;
  cache = fetch(`/fragments.bin?v=${FRAGMENT_VERSION}`)
    .then((r) => {
      if (!r.ok) throw new Error(`fragments.bin ${r.status}`);
      return readWithProgress(r, onProgress);
    })
    .then((buf) => {
      const view = new DataView(buf);
      const magic = view.getUint32(0, true);
      if (magic !== 0x46524147) throw new Error("bad fragments.bin magic");
      const version = view.getUint32(4, true);
      if (version !== 3) throw new Error(`expected v3 fragments, got v${version}`);
      const count = view.getUint32(8, true);
      const beats = view.getUint32(12, true);

      const headerBytes = 16;
      const vecBytes = count * 3 * 4;
      const fBytes = count * 4;

      const targets = new Float32Array(buf.slice(headerBytes, headerBytes + vecBytes));
      const dust = new Float32Array(
        buf.slice(headerBytes + vecBytes, headerBytes + vecBytes * 2),
      );
      const seeds = new Float32Array(
        buf.slice(headerBytes + vecBytes * 2, headerBytes + vecBytes * 2 + fBytes),
      );
      const homes = new Float32Array(
        buf.slice(headerBytes + vecBytes * 2 + fBytes, headerBytes + vecBytes * 2 + fBytes * 2),
      );
      return { count, beats, targets, dust, seeds, homes };
    });
  return cache;
}
