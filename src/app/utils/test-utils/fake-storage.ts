/**
 * An in-memory stand-in for `localStorage`, to be provided for
 * {@link LOCAL_STORAGE_TOKEN} in tests.
 *
 * Prefer this over `vi.spyOn(Storage.prototype, ...)`: `Storage.prototype` lives
 * in the worker process rather than the module registry, so Vitest's `isolate`
 * does not undo such a stub. An unrestored one leaks into every later spec file
 * and silently makes unrelated tests read a fake localStorage.
 */
export function createFakeStorage(
  initial: Record<string, string> = {},
): Storage {
  const entries = new Map<string, string>(Object.entries(initial));

  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    clear: () => {
      entries.clear();
    },
  };
}
