/**
 * Tiny localStorage cache used to paint instantly from stale data while a
 * fresh request revalidates in the background (masks Render cold starts).
 */
const PREFIX = "tomato:cache:";

type CacheEntry<T> = { value: T; savedAt: number };

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!isEntry(parsed)) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    const entry: CacheEntry<T> = { value, savedAt: Date.now() };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota exceeded or disabled storage — caching is best-effort.
  }
}

function isEntry(value: unknown): value is CacheEntry<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "savedAt" in value &&
    typeof (value as { savedAt: unknown }).savedAt === "number"
  );
}
