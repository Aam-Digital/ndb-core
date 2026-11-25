import { Injectable, inject } from "@angular/core";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import {
  getDeferredInstallPrompt,
  whenCanInstallDirectly,
  PWAInstallChoice,
} from "#src/bootstrap-pwa-install";

@Injectable({ providedIn: "root" })
export class PwaInstallService {
  private window = inject<Window>(WINDOW_TOKEN);

  /**
   * Resolves once/if it is possible to directly install the app.
   * `undefined` if the listener has not been registered during bootstrap.
   */
  get canInstallDirectly(): Promise<void> | undefined {
    return whenCanInstallDirectly();
  }

  installPWA(): Promise<PWAInstallChoice> {
    const installPrompt = getDeferredInstallPrompt();
    if (!installPrompt) {
      throw new Error(
        "InstallPWA called, but PWA install prompt has not fired.",
      );
    }
    installPrompt.prompt();
    return installPrompt.userChoice;
  }

  /**
   * Whether the user has to be told how to install the app manually.
   *
   * Browsers on iOS never fire `beforeinstallprompt`, so the app cannot start the
   * installation itself. The user has to use "Add to Home Screen" in the share menu.
   */
  showIOSInstallInstructions(): boolean {
    return this.isIOS() && this.isRealBrowser() && !this.detectStandaloneMode();
  }

  private isIOS(): boolean {
    const userAgent = this.window.navigator.userAgent;
    return (
      /iphone|ipad|ipod/i.test(userAgent) ||
      // iPadOS reports a Mac user agent by default, but only iPads have a touch screen
      (/macintosh/i.test(userAgent) && this.window.navigator.maxTouchPoints > 1)
    );
  }

  /** In-app webviews (e.g. of an email app) cannot "Add to Home Screen" and have no "Safari" in their user agent */
  private isRealBrowser(): boolean {
    return /safari/i.test(this.window.navigator.userAgent);
  }

  private detectStandaloneMode(): boolean {
    return (
      ("standalone" in this.window.navigator &&
        !!this.window.navigator["standalone"]) ||
      this.window.matchMedia("(display-mode: standalone)").matches
    );
  }
}
