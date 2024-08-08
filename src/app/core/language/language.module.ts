import { Inject, LOCALE_ID, NgModule } from "@angular/core";
import { LanguageService } from "./language.service";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { AcceptLanguageInterceptor } from "./accept-language.interceptor";
import moment from "moment/moment";
import { getLocaleFirstDayOfWeek } from "@angular/common";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { TranslatableMatPaginator } from "./TranslatableMatPaginator";

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
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AcceptLanguageInterceptor,
      multi: true,
    },
    { provide: MatPaginatorIntl, useValue: TranslatableMatPaginator() },
  ],
})
export class LanguageModule {
  constructor(
    translationService: LanguageService,
    @Inject(LOCALE_ID) locale: string,
  ) {
    translationService.initDefaultLanguage();

    moment.updateLocale(moment.locale(), {
      week: {
        dow: getLocaleFirstDayOfWeek(locale),
      },
    });
  }
}
