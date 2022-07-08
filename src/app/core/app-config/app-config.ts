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

import { SessionType } from "../session/session-type";
import { environment } from "../../../environments/environment";

/**
 * Central app configuration.
 *
 * The settings are defined in a json file and can therefore be changed for different deployments
 * without code changes.
 *
 * Simply use the static `AppConfig.settings` for easy access to the app's configuration.
 * You do _not_ have to inject the AppConfig service into your code in order to access the app settings.
 * AppConfig is an Angular service only because this is required for initially loading the remote settings into
 * the static AppConfig.settings object.
 *
 * @example
 * this.title = AppConfig.settings.site_name;
 * // just directly use AppConfig and let your IDE add an "import" statement to the file
 * // no need for dependency injection here
 */
export class AppConfig {
  /** Path for the reverse proxy that forwards to the database - configured in `proxy.conf.json` and `default.conf` */
  static readonly DB_PROXY_PREFIX = "/db";
  /** Name of the database that is used */
  static readonly DB_NAME = "app";
  /** Whether the app is running in demo mode */
  static DEMO_MODE = false;
  /** The session type that is used */
  static SESSION_TYPE = SessionType.synced;

  /**
   * Initializes static settings through the environment or the URL params.
   */
  static initSettings() {
    const params = new URLSearchParams(location.search);
    const demoMode = params.get("demo");
    const sessionType = params.get("session");
    if (demoMode === "true" || environment.demo_mode) {
      AppConfig.DEMO_MODE = true;
    }
    if (
      sessionType === "mock" ||
      environment.session_type === SessionType.mock
    ) {
      AppConfig.SESSION_TYPE = SessionType.mock;
    } else if (
      sessionType === "local" ||
      environment.session_type === SessionType.local
    ) {
      AppConfig.SESSION_TYPE = SessionType.local;
    }
  }
}
