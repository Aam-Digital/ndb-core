import { Inject, Injectable } from "@angular/core";
import { WINDOW_TOKEN } from "../../utils/di-tokens";

export enum PWAInstallType {
  ShowiOSInstallInstructions,
  RunningAsPWA,
  NotAvailable,
}

enum Browser {
  Opera,
  MicrosoftInternetExplorer,
  Edge,
  Safari,
  Chrome,
  Firefox,
  Other,
}

enum OS {
  iOS,
  MacOS,
  Android,
  Linux,
  Windows,
  Other,
}

@Injectable({ providedIn: "root" })
export class PwaInstallService {
  /**
   * Resolves once/if it is possible to directly install the app
   */
  static canInstallDirectly: Promise<void>;

  private static deferredInstallPrompt: any;

  constructor(@Inject(WINDOW_TOKEN) private window: Window) {}

  static registerPWAInstallListener() {
    this.canInstallDirectly = new Promise((resolve) => {
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
        resolve();
      });
    });
  }

  installPWA(): Promise<any> {
    if (!PwaInstallService.deferredInstallPrompt) {
      throw new Error(
        "InstallPWA called, but PWA install prompt has not fired.",
      );
    }
    PwaInstallService.deferredInstallPrompt.prompt();
    return PwaInstallService.deferredInstallPrompt.userChoice;
  }

  getPWAInstallType(): PWAInstallType {
    const os: OS = this.detectOS();
    const browser: Browser = this.detectBrowser();
    const standaloneMode: boolean = this.detectStandaloneMode();
    let pwaInstallType: PWAInstallType;
    if (standaloneMode) {
      pwaInstallType = PWAInstallType.RunningAsPWA;
    } else if (os === OS.iOS && browser === Browser.Safari) {
      pwaInstallType = PWAInstallType.ShowiOSInstallInstructions;
    } else {
      pwaInstallType = PWAInstallType.NotAvailable;
    }
    return pwaInstallType;
  }

  private detectOS(): OS {
    let os: OS;
    const userAgent = this.window.navigator.userAgent;
    if (/iphone|ipad|ipod|macintosh/i.test(userAgent)) {
      if (this.window.innerWidth < 1025) {
        os = OS.iOS;
      } else {
        os = OS.MacOS;
      }
    } else if (/android/i.test(userAgent)) {
      os = OS.Android;
    } else if (/windows|win32|win64|WinCE/i.test(userAgent)) {
      os = OS.Windows;
    } else if (/linux|X11/i.test(userAgent)) {
      os = OS.Linux;
    }
    return os;
  }

  private detectBrowser(): Browser {
    let browser: Browser;
    const userAgent = this.window.navigator.userAgent;
    if (/opera/i.test(userAgent)) {
      browser = Browser.Opera;
    } else if (/msie|trident/i.test(userAgent)) {
      browser = Browser.MicrosoftInternetExplorer;
    } else if (/edg/i.test(userAgent)) {
      browser = Browser.Edge;
    } else if (/chrome/i.test(userAgent)) {
      browser = Browser.Chrome;
    } else if (/safari/i.test(userAgent)) {
      browser = Browser.Safari;
      if (/crios|fxios/i.test(userAgent)) {
        browser = Browser.Chrome;
      }
    } else if (/firefox/i.test(userAgent)) {
      browser = Browser.Firefox;
    } else {
      browser = Browser.Other;
    }
    return browser;
  }

  private detectStandaloneMode(): boolean {
    return (
      ("standalone" in this.window.navigator &&
        !!this.window.navigator["standalone"]) ||
      this.window.matchMedia("(display-mode: standalone)").matches
    );
  }
}
