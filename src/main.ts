/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import { loadTranslations } from "@angular/localize";
import { registerLocaleData } from "@angular/common";
import { AppConfig } from "./app/core/app-config/app-config";
import localeDe from "@angular/common/locales/de";

// Import hammer.js to enable gestures
// on mobile devices
import "hammerjs";
import { parseTranslationsForLocalize } from "./app/utils/utils";

if (environment.production) {
  enableProdMode();
}

const locale = localStorage.getItem("locale") || "en-US";

if (locale !== "en-US") {
  fetch("/assets/locale/messages." + locale + ".xlf")
    .then((response) => response.text())
    // fetch("/assets/locale/messages.json")
    //   .then((response) => {
    //     if (!response.ok) {
    //       throw new Error("HTTP error " + response.status);
    //     }
    //     return response.json().then((res) => res.translations);
    //   })
    .then((res) => parseTranslationsForLocalize(res))
    .then(async (json) => {
      loadTranslations(json);
      $localize.locale = locale;

      // This is needed for locale-aware components & pipes to work.
      // Add the required locales to `webpackInclude` to keep the bundle size small
      // const localeModule = await import(
      //   /* webpackInclude: /(en-US|fr|de)\.js/ */
      //   `@angular/common/locales/${locale}`
      // );
      registerLocaleData(localeDe, locale);

      /**
       * Loading AppConfig before bootstrap process (see {@link https://stackoverflow.com/a/66957293/10713841})
       */
      AppConfig.load().then(() => {
        // Bootstrap app
        platformBrowserDynamic()
          .bootstrapModule(AppModule)
          .catch((err) => console.error(err));
      });
    })
    .catch((err) => console.log("error", err));
} else {
  /**
   * Loading AppConfig before bootstrap process (see {@link https://stackoverflow.com/a/66957293/10713841})
   */
  AppConfig.load().then(() => {
    // Bootstrap app
    platformBrowserDynamic()
      .bootstrapModule(AppModule)
      .catch((err) => console.error(err));
  });
}
