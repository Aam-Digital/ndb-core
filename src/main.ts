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

import { environment } from "./environments/environment";
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { initEnvironmentConfig } from "./bootstrap-environment";
import { Logging } from "./app/core/logging/logging.service";
import { PwaInstallService } from "./app/core/pwa-install/pwa-install.service";
import { initLanguage } from "./bootstrap-i18n";

if (environment.production) {
  enableProdMode();
}

// Listening to event as soon as possible
PwaInstallService.registerPWAInstallListener();

// Initialize remote logging
Logging.initRemoteLogging({
  dsn: environment.remoteLoggingDsn,
});

bootstrap(); // top-level await not possible here yet, therefore wrapped in `bootstrap()` function

async function bootstrap() {
  await initLanguage();

  await initEnvironmentConfig();

  await import("./app/app.module").then((m) =>
    platformBrowserDynamic().bootstrapModule(m.AppModule),
  );
}
