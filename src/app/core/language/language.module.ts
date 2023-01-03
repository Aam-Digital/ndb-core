import { NgModule } from "@angular/core";
import { LanguageSelectComponent } from "./language-select/language-select.component";
import { LanguageService } from "./language.service";

/**
 * Module that aids in the management and choice of translations/languages
 * <br/>
 * Use the {@link LanguageService} to get information about the currently
 * selected language, available languages and methods to change the language
 * <br/>
 * The {@link LanguageSelectComponent} is used to graphically offer a way of changing
 * the current language of the user
 */
@NgModule({})
export class LanguageModule {
  constructor(translationService: LanguageService) {
    translationService.initDefaultLanguage();
  }
}
