import { Component, TemplateRef, ViewChild } from "@angular/core";
import {
  MatSnackBar
} from "@angular/material/snack-bar";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";
@Component({
  selector: "app-pwa-install",
  templateUrl: "./pwa-install.component.html",
  styleUrls: ["./pwa-install.component.scss"],
})
export class PwaInstallComponent {
  @ViewChild("iOSInstallInstructions")
  templateIOSInstallInstructions: TemplateRef<any>;

  public showPWAInstallButton: boolean = false;
  public pwaInstallButtonText: string;
  public pwaInstallType: PWAInstallType;
  public deferredInstallPrompt;
  public userAgent: string;

  constructor(
    public snackBar: MatSnackBar,
    private pwaInstallService: PwaInstallService
  ) {
    this.pwaInstallType = pwaInstallService.getPWAInstallType();
    if (this.pwaInstallType === PWAInstallType.ShowiOSInstallInstructions) {
      this.showPWAInstallButton = true;
    }
    pwaInstallService.waitForPWAInstallPrompt.then( () => {
      this.showPWAInstallButton = true;
    } ); 
  }

  pwaInstallButtonClicked() {
    if (this.pwaInstallType === PWAInstallType.ShowiOSInstallInstructions) {
      this.snackBar.openFromTemplate(
        this.templateIOSInstallInstructions
      );
    } else if (this.pwaInstallType === PWAInstallType.InstallDirectly) {
      this.pwaInstallService.installPWA().then((choice) => {
        if (choice.outcome === "accepted") {
          this.showPWAInstallButton = false;
        }
      });

    }
  }
}
