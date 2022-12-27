import { Component, TemplateRef, ViewChild } from "@angular/core";
import { MatLegacySnackBar as MatSnackBar } from "@angular/material/legacy-snack-bar";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";

@Component({
  selector: "app-pwa-install",
  templateUrl: "./pwa-install.component.html",
  styleUrls: ["./pwa-install.component.scss"],
})
export class PwaInstallComponent {
  @ViewChild("iOSInstallInstructions")
  templateIOSInstallInstructions: TemplateRef<any>;

  showPWAInstallButton = false;

  private readonly pwaInstallType: PWAInstallType;

  constructor(
    public snackBar: MatSnackBar,
    private pwaInstallService: PwaInstallService
  ) {
    this.pwaInstallType = pwaInstallService.getPWAInstallType();
    if (this.pwaInstallType === PWAInstallType.ShowiOSInstallInstructions) {
      this.showPWAInstallButton = true;
    }
    PwaInstallService.canInstallDirectly?.then(() => {
      this.showPWAInstallButton = true;
    });
  }

  pwaInstallButtonClicked() {
    if (this.pwaInstallType === PWAInstallType.ShowiOSInstallInstructions) {
      this.snackBar.openFromTemplate(this.templateIOSInstallInstructions);
    } else {
      this.pwaInstallService.installPWA().then((choice) => {
        if (choice.outcome === "accepted") {
          this.showPWAInstallButton = false;
        }
      });
    }
  }
}
