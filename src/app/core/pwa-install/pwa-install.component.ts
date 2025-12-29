import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { PwaInstallService, PWAInstallType } from "./pwa-install.service";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IconButtonComponent } from "../common-components/icon-button/icon-button.component";

@Component({
  selector: "app-pwa-install",
  templateUrl: "./pwa-install.component.html",
  styleUrls: ["./pwa-install.component.scss"],
  imports: [
    MatButtonModule,
    Angulartics2Module,
    IconButtonComponent,
    FontAwesomeModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaInstallComponent implements OnInit {
  snackBar = inject(MatSnackBar);
  private pwaInstallService = inject(PwaInstallService);
  private changeDetector = inject(ChangeDetectorRef);

  @ViewChild("iOSInstallInstructions")
  templateIOSInstallInstructions: TemplateRef<any>;

  set showPWAInstallButton(value: boolean) {
    this._showPWAInstallButton = value;
    this.changeDetector.detectChanges();
  }

  _showPWAInstallButton = false;

  private pwaInstallType: PWAInstallType;

  ngOnInit() {
    this.pwaInstallType = this.pwaInstallService.getPWAInstallType();
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
