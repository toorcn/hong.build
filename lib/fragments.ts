"use client";

/**
 * Loads public/fragments.bin (v2 narrative morph layout).
 * Header: magic(4) version(4) count(4) beats(4), then
 *   targets[beats*count*3 f32] + noise[count*3 f32] + seeds[count f32].
 */

export interface FragmentData {
  count: number;
  beats: number;
  /** BEAT_COUNT blocks of count*3 resolved positions. */
  targets: Float32Array;
  /** Per-fragment dissolve noise vector. */
  noise: Float32Array;
  seeds: Float32Array;
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
  cache = fetch("/fragments.bin")
    .then((r) => {
      if (!r.ok) throw new Error(`fragments.bin ${r.status}`);
      return readWithProgress(r, onProgress);
    })
    .then((buf) => {
      const view = new DataView(buf);
      const magic = view.getUint32(0, true);
      if (magic !== 0x46524147) throw new Error("bad fragments.bin magic");
      const version = view.getUint32(4, true);
      if (version !== 2) throw new Error(`expected v2 fragments, got v${version}`);
      const count = view.getUint32(8, true);
      const beats = view.getUint32(12, true);

      const headerBytes = 16;
      const targetBytes = beats * count * 3 * 4;
      const noiseBytes = count * 3 * 4;
      const seedBytes = count * 4;

      const targets = new Float32Array(buf.slice(headerBytes, headerBytes + targetBytes));
      const noise = new Float32Array(
        buf.slice(headerBytes + targetBytes, headerBytes + targetBytes + noiseBytes),
      );
      const seeds = new Float32Array(
        buf.slice(
          headerBytes + targetBytes + noiseBytes,
          headerBytes + targetBytes + noiseBytes + seedBytes,
        ),
      );
      return { count, beats, targets, noise, seeds };
    });
  return cache;
}
