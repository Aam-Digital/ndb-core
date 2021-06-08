import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LanguageSelectComponent } from "./language-select.component";
import { FormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";

@NgModule({
  declarations: [LanguageSelectComponent],
  exports: [LanguageSelectComponent],
  imports: [CommonModule, FormsModule, MatSelectModule],
})
export class LanguageSelectorModule {}
