import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

enum PWAInstallType {InstallDirectly, ShowiOSInstallInstructions, RunningAsPWA, NotAvailable}
enum Browser {Opera, MicrosoftInternetExplorer, Edge, Safari, Chrome, Firefox, Other}
enum OS {iOS, MacOS, Android, Linux, Windows, Other}
@Component({
  selector: 'app-pwa-install',
  templateUrl: './pwa-install.component.html',
  styleUrls: ['./pwa-install.component.scss']
})

export class PwaInstallComponent implements OnInit {
  
  @ViewChild('iOSInstallInstructions') templateiOSInstallInstructions: TemplateRef<any>;
  @ViewChild('pwaAlreadyInstalled') templatepwaAlreadyInstalled: TemplateRef<any>;
  setAutoHide = false;
  autoHide = 10000;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'bottom';
  matSnackBarConfig = new MatSnackBarConfig();

  
  public showPWAInstallButton: Boolean = false;
  public pwaInstallButtonText: String; 
  public pwaInstallType: PWAInstallType;
  public deferredInstallPrompt;
  public userAgent: string;
  public beforeInstallPromptFired: Boolean = false;
  
  constructor(
      public snackBar: MatSnackBar,
  ) {

    this.matSnackBarConfig.verticalPosition = this.verticalPosition;
    this.matSnackBarConfig.horizontalPosition = this.horizontalPosition;
    this.matSnackBarConfig.duration = this.setAutoHide ? this.autoHide : 0;

    this.userAgent = window.navigator.userAgent; 
    const os: OS = this.detectOS();
    const browser: Browser = this.detectBrowser();
    const standaloneMode: Boolean = this.detectStandaloneMode();
    this.pwaInstallType = this.detectPWAInstallType(os, browser, standaloneMode);

    console.log("PWA Install Information:")
    console.log("--- " + os + ", " + browser + ", standalone: " + standaloneMode);
    console.log("--- " + this.pwaInstallType);

    if (this.pwaInstallType === PWAInstallType.ShowiOSInstallInstructions) {
      this.showPWAInstallButton = true;
      this.pwaInstallButtonText = "Install App";
    } else this.showDelayedPWAInstallButton();

  }

  private sleep(miliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, miliseconds));
  }
  
  private async showDelayedPWAInstallButton() {
    await this.sleep(5000);
    if (this.pwaInstallType === PWAInstallType.InstallDirectly && !this.beforeInstallPromptFired) {
      this.showPWAInstallButton = true;  
      this.pwaInstallButtonText = "App already installed";
    }   
  }

  detectOS() : OS {
    let os: OS;
    if (/iphone|ipad|ipod|macintosh/i.test(this.userAgent)) {
      if (window.innerWidth < 1025) {
        os = OS.iOS;
      }
      else {
        os = OS.MacOS;
      }
    }
    else if (/android/i.test(this.userAgent)) {
      os = OS.Android;
    }
    else if (/windows|win32|win64|WinCE/i.test(this.userAgent)) {
      os = OS.Windows
    }
    else if (/linux|X11/i.test(this.userAgent)) {
      os = OS.Linux;
    }
    return os;
  }

  detectBrowser() : Browser {
    let browser: Browser;
    if (/opera/i.test(this.userAgent)) {
      browser = Browser.Opera;
    }
    else if (/msie|trident/i.test(this.userAgent)) {
      browser = Browser.MicrosoftInternetExplorer;
    }
    else if (/edg/i.test(this.userAgent)) {
      browser = Browser.Edge;
    }
    else if (/chrome/i.test(this.userAgent)) {
      browser = Browser.Chrome;
    }
    else if (/safari/i.test(this.userAgent)) {
      browser = Browser.Safari;
      if (/crios|fxios/i.test(this.userAgent)) {
        browser = Browser.Chrome;
      }
    }
    else if (/firefox/i.test(this.userAgent)) {
      browser = Browser.Firefox;
    }
    else {
      browser = Browser.Other;
    }
    return browser;
  }

  detectStandaloneMode() : Boolean {
    return (("standalone" in window.navigator && window.navigator['standalone']) || window.matchMedia('(display-mode: standalone)').matches);
  }

  detectPWAInstallType(os, browser, standaloneMode) : PWAInstallType {
    if (standaloneMode) {
      this.pwaInstallType = PWAInstallType.RunningAsPWA;
    } else
      if (os === OS.Android) {
        this.pwaInstallType = PWAInstallType.InstallDirectly;
      }
      else if (os === OS.iOS) {
        if (browser === Browser.Safari) {
          this.pwaInstallType = PWAInstallType.ShowiOSInstallInstructions;
        }
      }
      else if (os === OS.Windows || os === OS.MacOS) {
        if (browser === Browser.Chrome || browser === Browser.Edge ) {
          this.pwaInstallType = PWAInstallType.InstallDirectly;
        }
      }
      else if (os === OS.Linux) {
        if (browser === Browser.Chrome) {
          this.pwaInstallType = PWAInstallType.InstallDirectly;
        }
      }
      else {
        this.pwaInstallType = PWAInstallType.NotAvailable;
    }
    return this.pwaInstallType;
  }

  pwaInstallButtonClicked() {
    if (this.pwaInstallType === PWAInstallType.ShowiOSInstallInstructions) {
      this.snackBar.openFromTemplate(this.templateiOSInstallInstructions, this.matSnackBarConfig);
    }
    else if (this.pwaInstallType === PWAInstallType.InstallDirectly) {
      if (!this.beforeInstallPromptFired) {
        this.snackBar.openFromTemplate(this.templatepwaAlreadyInstalled, this.matSnackBarConfig);
      } else {
        this.deferredInstallPrompt.prompt();
        this.deferredInstallPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            console.log('User accepted the PWA-install prompt');
            this.showPWAInstallButton = false;
          } else {
            console.log('User dismissed the pwa-install prompt');
          }
          this.deferredInstallPrompt = null;
        });
      }
    }
  }

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      this.beforeInstallPromptFired = true;
      this.showPWAInstallButton = true;
      this.pwaInstallButtonText = "Install app";
      e.preventDefault();                         
      this.deferredInstallPrompt = e;
    });

    window.addEventListener("appinstalled", evt => {
      console.log("App has been installed as PWA.", evt);
    });

  }
}

