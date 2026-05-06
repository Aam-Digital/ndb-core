import { enableVitestProxyZoneCompat } from "./app/utils/test-utils/vitest-proxy-zone-compat";
import { environment } from "./environments/environment";
import { SessionType } from "./app/core/session/session-type";
import { getTestBed } from "@angular/core/testing";

enableVitestProxyZoneCompat();

// Destroy the Angular TestBed module after each test to prevent stale
// `providedIn: 'root'` singleton instances from leaking across tests.
beforeEach(() => {
  getTestBed().resetTestingModule();
});

// Reset environment.session_type after every test to prevent cross-test pollution.
afterEach(() => {
  environment.session_type = SessionType.mock;
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
