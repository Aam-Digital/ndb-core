import { enableVitestProxyZoneCompat } from "./app/utils/test-utils/vitest-proxy-zone-compat";
import { environment } from "./environments/environment";
import { SessionType } from "./app/core/session/session-type";
import {
  PRISTINE_TEST_ENTITY_SCHEMA,
  TestEntity,
} from "./app/utils/test-utils/TestEntity";

enableVitestProxyZoneCompat();

beforeEach(() => {
  // Reset environment.session_type to the default before every test to prevent
  // pollution from a previous test (or production code mutating it during a
  // test's lifecycle, e.g. LoginComponent).
  environment.session_type = SessionType.mock;
});

afterEach(() => {
  // Defensive: also reset after each test.
  environment.session_type = SessionType.mock;

  // Restore the shared static TestEntity.schema so a spec that adds, replaces or
  // removes fields without cleaning up (or that throws before its inline cleanup
  // runs) cannot leak into later-running specs. The Angular unit-test builder
  // runs non-isolated, so this static state is shared across spec files.
  TestEntity.schema.clear();
  for (const [key, value] of PRISTINE_TEST_ENTITY_SCHEMA) {
    TestEntity.schema.set(key, value);
  }
});

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}

if (!globalThis.ResizeObserver) {
  class ResizeObserverMock {
    observe() {
      return undefined;
    }
    unobserve() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  }

  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
  });
}

if (!Element.prototype.scrollIntoView) {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    writable: true,
    configurable: true,
    value: () => undefined,
  });
}

globalThis.fail = (message?: string): never => {
  throw new Error(message ?? "Test failed");
};
