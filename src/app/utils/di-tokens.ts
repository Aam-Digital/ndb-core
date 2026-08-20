import { InjectionToken } from "@angular/core";

/**
 * Use this instead of directly referencing the window object for better testability
 */
export const WINDOW_TOKEN = new InjectionToken<Window>("Window object");
// Following this post to allow testing of the location object: https://itnext.io/testing-browser-window-location-in-angular-application-e4e8388508ff
export const LOCATION_TOKEN = new InjectionToken<Location>(
  "Window location object",
);
export const NAVIGATOR_TOKEN = new InjectionToken<Navigator>(
  "Window navigator object",
);
/**
 * Use this instead of referencing `localStorage` directly.
 *
 * Tests otherwise have to stub `Storage.prototype`, which belongs to the worker
 * process rather than the module registry — Vitest's `isolate` does not undo it,
 * so an unrestored stub leaks into every later spec file and makes unrelated
 * tests read a fake localStorage. Injecting a fake avoids that entirely.
 */
export const LOCAL_STORAGE_TOKEN = new InjectionToken<Storage>(
  "Window localStorage object",
  { providedIn: "root", factory: () => localStorage },
);
