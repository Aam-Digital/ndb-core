import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pwa-install',
  templateUrl: './pwa-install.component.html',
  styleUrls: ['./pwa-install.component.scss']
})
export class PwaInstallComponent implements OnInit {

  public installText: String = '';
  public installText2: String = '';
  
  constructor() {
    const userAgent = window.navigator.userAgent;

    const whichOS = () => {
      let OS = "";
      if (/iphone|ipad|ipod|macintosh/i.test(userAgent)) {
        if (window.innerWidth < 1025) {
          OS = "iOS";
        }
        else {
          OS = "MacOS";
        }
      }
      else if (/android/i.test(userAgent)) {
        OS = "Android";
      }
      else if (/windows|win32|win64|WinCE/i.test(userAgent)) {
        OS = "Windows";
      }
      else if (/linux|X11/i.test(userAgent)) {
        OS = "Linux";
      }
      return OS;
    }

    const whichBrowser = () => {
      let browser = "";
      if (/opera/i.test(userAgent)) {
        browser = "Opera";
      }
      else if (/msie|trident/i.test(userAgent)) {
        browser = "Microsoft Internet Explorer";
      }
      else if (/edg/i.test(userAgent)) {
        browser = "Edge";
      }
      else if (/chrome/i.test(userAgent)) {
        browser = "Chrome";
      }
      else if (/safari/i.test(userAgent)) {
        browser = "Safari";
        if (/crios|fxios/i.test(userAgent)) {
          browser = "Chrome";
        }
      }
      else if (/firefox/i.test(userAgent)) {
        browser = "Firefox";
      }
      else {
        browser = "other";
      }
      return browser;
    }
    
    //const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator['standalone']);
    const isInStandaloneMode = (("standalone" in window.navigator && window.navigator['standalone']) || window.matchMedia('(display-mode: standalone)').matches);
    const isInStandaloneText = () => {
      if (isInStandaloneMode) {
        return "standalone"
      }
      else {
        return "no standalone";
      }
    }

    this.installText = whichOS() + ", " + whichBrowser() + ", " + isInStandaloneText();
    
    if (isInStandaloneMode) {
      this.installText2 = 'Already installed as PWA'
    } else
      if (whichOS() === 'Android') {
        this.installText2 = 'Install directly'
      }
      else if (whichOS() === 'iOS') {
        if (whichBrowser() === 'Safari') {
          this.installText2 = 'Install instructions'
        }
      }
      else if (whichOS() === 'Windows') {
        if (whichBrowser() === 'Chrome' || whichBrowser() === 'Edge' ) {
          this.installText2 = 'Install directly'
        }
      }
      else if (whichOS() === 'MacOS') {
        if (whichBrowser() === 'Chrome' || whichBrowser() === 'Edge' ) {
          this.installText2 = 'Install directly'
        }
      }
      else if (whichOS() === 'Linux') {
        if (whichBrowser() === 'Chrome') {
          this.installText2 = 'Install directly'
        }
      }
      else {
        this.installText2 = 'PWA not possible'
    }

    let deferredPrompt; // Variable should be out of scope of addEventListener method

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();	// This prevents default chrome prompt from appearing                             
      deferredPrompt = e;	 // Save for later
      const installBtn = document.getElementById('PWAInstallButton');
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', () => {
        // Update the install UI to remove the install button
        installBtn.style.display = 'none';
        // Show the modal add to home screen dialog
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            console.log('User accepted the PWA-install prompt');
          } else {
            console.log('User dismissed the pwa-install prompt');
          }
          // Clear the saved prompt since it can't be used again
          deferredPrompt = null;
        });
      });
    });

    window.addEventListener("appinstalled", evt => {
      console.log("PWA-Install fired", evt);
    });
  }

  ngOnInit(): void {
  }


}
