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

  const api: Storage = {
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

  // Real Storage exposes its entries as own enumerable properties, so callers
  // can use `Object.entries(localStorage)` / `Object.keys(localStorage)` and
  // index access. The Proxy keeps that behaviour, which a plain object lacks.
  return new Proxy(api, {
    get: (target, prop) =>
      prop in target || typeof prop === "symbol"
        ? Reflect.get(target, prop)
        : entries.get(prop),
    set: (target, prop, value) => {
      if (prop in target) {
        return Reflect.set(target, prop, value);
      }
      entries.set(String(prop), String(value));
      return true;
    },
    has: (target, prop) => prop in target || entries.has(String(prop)),
    deleteProperty: (_target, prop) => entries.delete(String(prop)),
    ownKeys: () => [...entries.keys()],
    getOwnPropertyDescriptor: (_target, prop) =>
      entries.has(String(prop))
        ? {
            value: entries.get(String(prop)),
            enumerable: true,
            configurable: true,
            writable: true,
          }
        : undefined,
  });
}
