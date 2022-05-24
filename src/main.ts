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
import { AppConfig } from "./app/core/app-config/app-config";

// Import hammer.js to enable gestures
// on mobile devices
import "hammerjs";

if (environment.production) {
  enableProdMode();
}

/**
 * Loading AppConfig before bootstrap process (see {@link https://stackoverflow.com/a/66957293/10713841})
 */
AppConfig.load().then(() =>
  platformBrowserDynamic().bootstrapModule(AppModule)
);
