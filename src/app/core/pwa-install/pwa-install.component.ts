import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";
import { NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "app-pwa-install",
  templateUrl: "./pwa-install.component.html",
  styleUrls: ["./pwa-install.component.scss"],
  imports: [NgIf, MatButtonModule, Angulartics2Module, FontAwesomeModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
