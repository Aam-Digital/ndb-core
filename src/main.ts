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

import { loadTranslations } from "@angular/localize";
import { registerLocaleData } from "@angular/common";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./app/core/language/language-statics";
import { environment } from "./environments/environment";
import { enableProdMode } from "@angular/core";
import * as parseXliffToJson from "./app/utils/parse-xliff-to-js";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppSettings } from "./app/core/app-settings";
import { LoggingService } from "./app/core/logging/logging.service";
import { PwaInstallService } from "./app/core/pwa-install/pwa-install.service";

if (environment.production) {
  enableProdMode();
}

// Listening to event as soon as possible
PwaInstallService.registerPWAInstallListener();

// Initialize remote logging
LoggingService.initRemoteLogging({
  dsn: environment.remoteLoggingDsn,
});
const logger = new LoggingService();

const appLang =
  localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) ?? DEFAULT_LANGUAGE;
if (appLang === DEFAULT_LANGUAGE) {
  bootstrap();
} else {
  initLanguage(appLang).finally(() => bootstrap());
}

function bootstrap(): Promise<any> {
  // Dynamically load the main module after the language has been initialized
  return AppSettings.initRuntimeSettings()
    .catch((err) => logger.error(err))
    .then(() => import("./app/app.module"))
    .then((m) => platformBrowserDynamic().bootstrapModule(m.AppModule))
    .catch((err) => logger.error(err));
}

async function initLanguage(locale: string): Promise<void> {
  const json = await fetch("/assets/locale/messages." + locale + ".json")
    .then((r) => r.json())
    .catch(() =>
      // parse translation at runtime if JSON file is not available
      fetch("/assets/locale/messages." + locale + ".xlf")
        .then((r) => r.text())
        .then((t) => parseXliffToJson(t)),
    );

  loadTranslations(json);
  $localize.locale = locale;
  // This is needed for locale-aware components & pipes to work.
  // Add the required locales to `webpackInclude` to keep the bundle size small
  const localeModule = await import(
    /* webpackInclude: /(fr|de|it)\.mjs/ */
    `../node_modules/@angular/common/locales/${locale}`
  );
  registerLocaleData(localeModule.default);
}
