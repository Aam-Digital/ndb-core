import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LanguageChangeProcessDialogComponent } from "./language-change-process-dialog/language-change-process-dialog.component";
import { LanguageSelectComponent } from "./language-selector/language-select.component";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AlertsModule } from "../alerts/alerts.module";
import { MatDialogModule } from "@angular/material/dialog";
import { TranslationService } from "./translation.service";

/**
 * Module that aids in the management and choice of translations/languages
 * <br/>
 * Use the {@link TranslationService} to get information about the currently
 * selected language, available languages and methods to change the language
 * <br/>
 * The {@link LanguageSelectComponent} is used to graphically offer a way of changing
 * the current language of the user
 */
@NgModule({
  declarations: [LanguageChangeProcessDialogComponent, LanguageSelectComponent],
  imports: [
    CommonModule,
    MatSelectModule,
    MatProgressBarModule,
    AlertsModule,
    MatDialogModule,
  ],
  providers: [TranslationService],
  exports: [LanguageSelectComponent],
})
export class TranslationModule {}
