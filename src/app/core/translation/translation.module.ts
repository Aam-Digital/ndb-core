import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslatableMatPaginator } from "./TranslatableMatPaginator";
import { LanguageChangeProcessDialogComponent } from "./language-change-process-dialog/language-change-process-dialog.component";
import { LanguageSelectComponent } from "./language-selector/language-select.component";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressBarModule } from "@angular/material/progress-bar";

@NgModule({
  declarations: [LanguageChangeProcessDialogComponent, LanguageSelectComponent],
  imports: [CommonModule, MatSelectModule, MatProgressBarModule],
  exports: [LanguageChangeProcessDialogComponent, LanguageSelectComponent],
})
export class TranslationModule {}
