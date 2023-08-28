import { NgModule } from "@angular/core";
import { LanguageService } from "./language.service";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import { availableLocales } from "./languages";

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
  constructor(
    translationService: LanguageService,
    enumService: ConfigurableEnumService,
  ) {
    translationService.initDefaultLanguage();
    // Making locales enum available at runtime
    enumService["cacheEnum"](availableLocales);
  }
}
