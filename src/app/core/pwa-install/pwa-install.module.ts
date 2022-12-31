import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PwaInstallComponent } from "./pwa-install.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatSnackBarModule } from "@angular/material/snack-bar";
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
  providers: [{ provide: WINDOW_TOKEN, useValue: window }],
  exports: [PwaInstallComponent],
})
export class PwaInstallModule {}
