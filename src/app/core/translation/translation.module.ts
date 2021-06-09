import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LanguageChangeProcessDialogComponent } from "./language-change-process-dialog/language-change-process-dialog.component";
import { LanguageSelectComponent } from "./language-selector/language-select.component";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AlertsModule } from "../alerts/alerts.module";
import { MatDialogModule } from "@angular/material/dialog";
import { TranslationService } from "./translation.service";

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
  exports: [LanguageChangeProcessDialogComponent, LanguageSelectComponent],
})
export class TranslationModule {}
