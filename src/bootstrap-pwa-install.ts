/**
 * Capture the browser's PWA install prompt during bootstrap.
 *
 * This module is imported by `main.ts` and therefore evaluated *before*
 * `initLanguage()` has loaded any translations. Like `bootstrap-i18n.ts` and
 * `bootstrap-environment.ts` it must not import anything from `src/app/`, so
 * that bootstrapping does not pull the application's dependency graph into the
 * pre-i18n phase (see doc/compodoc_sources/concepts/i18n.md).
 *
 * The app-facing API for this is `PwaInstallService`.
 */

/** The deferred `beforeinstallprompt` event, to be triggered on user request */
let deferredInstallPrompt: any;

/** Resolves once/if it is possible to directly install the app */
let canInstallDirectly: Promise<void> | undefined;

/**
 * Start listening for the browser's `beforeinstallprompt` event and defer it,
 * so that the app can offer an install button at any later point.
 *
 * Must be called before any async operation during bootstrap, because the
 * browser fires the event early and does not replay it for later listeners.
 */
export function registerPWAInstallListener(): void {
  canInstallDirectly = new Promise((resolve) => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      resolve();
    });
  });
}

/**
 * Resolves once/if the app can be installed directly.
 * `undefined` if {@link registerPWAInstallListener} has not run.
 */
export function whenCanInstallDirectly(): Promise<void> | undefined {
  return canInstallDirectly;
}

/**
 * The deferred install prompt, if the browser has offered one already.
 */
export function getDeferredInstallPrompt(): any {
  return deferredInstallPrompt;
}

/**
 * Discard the deferred prompt and the listener's promise.
 * Only needed in tests, to undo the module-level state of a previous case.
 */
export function resetPWAInstallListener(): void {
  deferredInstallPrompt = undefined;
  canInstallDirectly = undefined;
}
