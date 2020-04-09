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

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppConfig } from './app-config';
import { HttpClientModule } from '@angular/common/http';

/**
 * Management of central configuration for the app that can a set by an administrator independent of code
 * in the assets/config.json file.
 *
 * Just import this module in your root module to ensure the AppConfig is properly initialized on startup.
 *
 * You can then use the static `AppConfig.settings` object (which exactly represents the contents of the config.json)
 * to access the configuration values without need for dependency injection of a service.
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
  ],
  declarations: [],
  providers: [
    AppConfig,
    { provide: APP_INITIALIZER, useFactory: initializeAppConfig, deps: [AppConfig], multi: true },
  ],
})
export class AppConfigModule {
}

/**
 * Factory method for APP_INITIALIZER to load essential things before any other modules.
 * This is required to ensure the AppConfig.settings are available before other code needs it.
 *
 * @param appConfig The AppConfig service (through dependency injection)
 */
export function initializeAppConfig(appConfig: AppConfig) {
  return () => appConfig.load();
}
