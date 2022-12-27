import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LanguageSelectComponent } from "./language-select/language-select.component";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { LanguageService } from "./language.service";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { MatIconModule } from "@angular/material/icon";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";

/**
 * Module that aids in the management and choice of translations/languages
 * <br/>
 * Use the {@link LanguageService} to get information about the currently
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
  providers: [LanguageService],
  exports: [LanguageSelectComponent],
})
export class LanguageModule {
  constructor(translationService: LanguageService) {
    translationService.initDefaultLanguage();
  }
}
