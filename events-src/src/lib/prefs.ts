const PREFIX = "builderline.";

/** Storage can be missing or throw (private mode, blocked site data); preferences then last one visit. */
export function readPref<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable: keep the in-memory value only.
  }
}
