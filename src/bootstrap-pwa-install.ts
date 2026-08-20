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

/** The user's response to the install prompt. */
export interface PWAInstallChoice {
  outcome: "accepted" | "dismissed";
  platform: string;
}

/**
 * The browser's non-standard `beforeinstallprompt` event.
 * Not part of the DOM lib types, so we declare the shape we rely on ourselves.
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<PWAInstallChoice>;
  prompt(): Promise<void>;
}

/** The deferred `beforeinstallprompt` event, to be triggered on user request */
let deferredInstallPrompt: BeforeInstallPromptEvent | undefined;

/** Resolves once/if it is possible to directly install the app */
let canInstallDirectly: Promise<void> | undefined;

/** The registered listener, kept so {@link resetPWAInstallListener} can remove it again */
let installPromptListener: ((e: Event) => void) | undefined;

/**
 * Start listening for the browser's `beforeinstallprompt` event and defer it,
 * so that the app can offer an install button at any later point.
 *
 * Must be called before any async operation during bootstrap, because the
 * browser fires the event early and does not replay it for later listeners.
 */
export function registerPWAInstallListener(): void {
  canInstallDirectly = new Promise((resolve) => {
    installPromptListener = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      resolve();
    };
    window.addEventListener("beforeinstallprompt", installPromptListener);
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
export function getDeferredInstallPrompt():
  BeforeInstallPromptEvent | undefined {
  return deferredInstallPrompt;
}

/**
 * Discard the deferred prompt and the listener's promise, and remove the
 * `beforeinstallprompt` listener from `window`.
 * Only needed in tests, to undo the module-level state of a previous case.
 */
export function resetPWAInstallListener(): void {
  if (installPromptListener) {
    window.removeEventListener("beforeinstallprompt", installPromptListener);
    installPromptListener = undefined;
  }
  deferredInstallPrompt = undefined;
  canInstallDirectly = undefined;
}
