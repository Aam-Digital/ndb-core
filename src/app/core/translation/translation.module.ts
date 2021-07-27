import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LanguageSelectComponent } from "./language-selector/language-select.component";
import { MatSelectModule } from "@angular/material/select";
import { TranslationService } from "./translation.service";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

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
  declarations: [LanguageSelectComponent],
  imports: [
    CommonModule,
    MatSelectModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
  ],
  providers: [TranslationService],
  exports: [LanguageSelectComponent],
})
export class TranslationModule {}
