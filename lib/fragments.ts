"use client";

/**
 * Loads public/fragments.bin produced by scripts/generate-fragments.ts.
 * Layout: 16-byte header, then positions (f32 x3), vantageIds (u8), seeds (f32).
 */

export interface FragmentData {
  count: number;
  positions: Float32Array;
  vantageIds: Uint8Array;
  seeds: Float32Array;
}

let cache: Promise<FragmentData> | null = null;

export function loadFragments(): Promise<FragmentData> {
  if (cache) return cache;
  cache = fetch("/fragments.bin")
    .then((r) => {
      if (!r.ok) throw new Error(`fragments.bin ${r.status}`);
      return r.arrayBuffer();
    })
    .then((buf) => {
      const view = new DataView(buf);
      const magic = view.getUint32(0, true);
      if (magic !== 0x46524147) throw new Error("bad fragments.bin magic");
      const count = view.getUint32(8, true);
      const headerBytes = 16;
      const posBytes = count * 3 * 4;
      const idBytes = count;
      const seedBytes = count * 4;

      const positions = new Float32Array(buf.slice(headerBytes, headerBytes + posBytes));
      const vantageIds = new Uint8Array(
        buf.slice(headerBytes + posBytes, headerBytes + posBytes + idBytes),
      );
      const seeds = new Float32Array(
        buf.slice(headerBytes + posBytes + idBytes, headerBytes + posBytes + idBytes + seedBytes),
      );
      return { count, positions, vantageIds, seeds };
    });
  return cache;
}
