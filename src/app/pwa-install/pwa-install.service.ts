import { Injectable } from "@angular/core";

export enum PWAInstallType {
  InstallDirectly,
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

@Injectable()
export class PwaInstallService {
  private deferredInstallPrompt: any;
  private readonly userAgent: string;
  waitForPWAInstallPrompt: Promise<void>;

  constructor() {
    this.userAgent = window.navigator.userAgent;
  }

  registerPWAInstallListener() {
    this.waitForPWAInstallPrompt = new Promise((resolve) => {
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
        resolve();
      });
    });
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
    if (/iphone|ipad|ipod|macintosh/i.test(this.userAgent)) {
      if (window.innerWidth < 1025) {
        os = OS.iOS;
      } else {
        os = OS.MacOS;
      }
    } else if (/android/i.test(this.userAgent)) {
      os = OS.Android;
    } else if (/windows|win32|win64|WinCE/i.test(this.userAgent)) {
      os = OS.Windows;
    } else if (/linux|X11/i.test(this.userAgent)) {
      os = OS.Linux;
    }
    return os;
  }

  private detectBrowser(): Browser {
    let browser: Browser;
    if (/opera/i.test(this.userAgent)) {
      browser = Browser.Opera;
    } else if (/msie|trident/i.test(this.userAgent)) {
      browser = Browser.MicrosoftInternetExplorer;
    } else if (/edg/i.test(this.userAgent)) {
      browser = Browser.Edge;
    } else if (/chrome/i.test(this.userAgent)) {
      browser = Browser.Chrome;
    } else if (/safari/i.test(this.userAgent)) {
      browser = Browser.Safari;
      if (/crios|fxios/i.test(this.userAgent)) {
        browser = Browser.Chrome;
      }
    } else if (/firefox/i.test(this.userAgent)) {
      browser = Browser.Firefox;
    } else {
      browser = Browser.Other;
    }
    return browser;
  }

  private detectStandaloneMode(): boolean {
    return (
      ("standalone" in window.navigator && window.navigator["standalone"]) ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  }

  installPWA(): Promise<any> {
    if (!this.deferredInstallPrompt) {
      throw new Error(
        "InstallPWA called, but PWA install prompt has not fired."
      );
    }
    this.deferredInstallPrompt.prompt();
    return this.deferredInstallPrompt.userChoice;
  }
}
