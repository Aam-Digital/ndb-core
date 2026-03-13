type TestFunction = (...args: any[]) => unknown;

function isFunction(value: unknown): value is TestFunction {
  return typeof value === "function";
}

function wrapWithProxyZone(fn: TestFunction): TestFunction {
  return function proxyZoneWrapped(this: unknown, ...args: unknown[]) {
    const ZoneCtor = (globalThis as any).Zone;
    const ProxyZoneSpecCtor = ZoneCtor?.ProxyZoneSpec;

    if (!ZoneCtor || !isFunction(ProxyZoneSpecCtor)) {
      return fn.apply(this, args);
    }

    const proxyZone = ZoneCtor.current.fork(new (ProxyZoneSpecCtor as any)());
    return proxyZone.run(fn, this, args);
  };
}

function callbackIndex(args: unknown[]): number | null {
  if (isFunction(args[0])) {
    return 0;
  }

  if (typeof args[0] === "string" || args[0] instanceof RegExp) {
    return isFunction(args[1]) ? 1 : null;
  }

  return isFunction(args[1]) ? 1 : null;
}

function patchCallable(target: Record<string, unknown>, key: string): void {
  const original = target[key];
  if (!isFunction(original)) {
    return;
  }

  if ((original as any).__proxyZonePatched) {
    return;
  }

  const patched = function proxyZonePatched(
    this: unknown,
    ...args: unknown[]
  ): unknown {
    const index = callbackIndex(args);
    if (index !== null) {
      args[index] = wrapWithProxyZone(args[index] as TestFunction);
    }

    return original.apply(this, args);
  } as TestFunction & { __proxyZonePatched?: boolean };

  // Preserve non-enumerable properties such as `skip`, `only`, `todo`, etc.
  for (const propertyKey of Reflect.ownKeys(original)) {
    if (propertyKey === "length" || propertyKey === "name" || propertyKey === "prototype") {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(original, propertyKey);
    if (descriptor) {
      Object.defineProperty(patched, propertyKey, descriptor);
    }
  }

  patched.__proxyZonePatched = true;
  target[key] = patched;

}

export function enableVitestProxyZoneCompat(): void {
  const target = globalThis as Record<string, unknown>;
  for (const key of [
    "describe",
    "it",
    "test",
    "beforeEach",
    "afterEach",
    "beforeAll",
    "afterAll",
  ]) {
    patchCallable(target, key);
  }
}
