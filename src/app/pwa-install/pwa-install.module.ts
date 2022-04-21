import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PwaInstallComponent } from "./pwa-install.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslationModule } from "app/core/translation/translation.module";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { PwaInstallService } from "./pwa-install.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { WINDOW_TOKEN } from "../utils/di-tokens";
import { Angulartics2Module } from "angulartics2";
@NgModule({
  declarations: [PwaInstallComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatButtonModule,
    FlexLayoutModule,
    TranslationModule,
    MatSidenavModule,
    MatToolbarModule,
    MatSnackBarModule,
    Angulartics2Module,
  ],
  providers: [PwaInstallService, { provide: WINDOW_TOKEN, useValue: window }],
  exports: [PwaInstallComponent],
})
export class PwaInstallModule {
  constructor(pwaInstallService: PwaInstallService) {
    pwaInstallService.registerPWAInstallListener();
  }
}
