import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PwaInstallComponent } from "./pwa-install.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { PwaInstallService } from "./pwa-install.service";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import { Angulartics2Module } from "angulartics2";

@NgModule({
  declarations: [PwaInstallComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatSnackBarModule,
    Angulartics2Module,
  ],
  providers: [PwaInstallService, { provide: WINDOW_TOKEN, useValue: window }],
  exports: [PwaInstallComponent],
})
export class PwaInstallModule {}
