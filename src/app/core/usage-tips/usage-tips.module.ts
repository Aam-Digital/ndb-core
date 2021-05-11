import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { InstallAppPromptComponent } from "./install-app-prompt/install-app-prompt.component";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { PwaInstallationService } from "./pwa-installation.service";

@NgModule({
  declarations: [InstallAppPromptComponent],
  imports: [CommonModule, MatIconModule, MatToolbarModule],
  providers: [PwaInstallationService],
})
export class UsageTipsModule {
  constructor(pwaInstallationService: PwaInstallationService) {
    pwaInstallationService.initPwaPrompt();
  }
}
