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

  static readonly DEMO_LOCAL_STORAGE_KEY = "demo_mode";

  static readonly SESSION_LOCAL_STORAGE_KEY = "session_type";
  /** Whether the app is running in demo mode */
  static DEMO_MODE = false;
  /** The session type that is used */
  static SESSION_TYPE = SessionType.synced;

  /**
   * Initializes static settings through the URL params, the local storage or the environment.
   *
   * The settings are checked and used in the following order:
   * 1. URL params
   * 2. Local storage
   * 3. Environment
   */
  static initSettings() {
    const params = new URLSearchParams(location.search);
    this.DEMO_MODE = this.isDemoMode(params);
    this.SESSION_TYPE = this.getSession(params);
  }

  private static isDemoMode(params: URLSearchParams): boolean {
    const demoParam = params.get("demo");
    const demoStorage = localStorage.getItem(this.DEMO_LOCAL_STORAGE_KEY);
    if (demoParam) {
      localStorage.setItem(this.DEMO_LOCAL_STORAGE_KEY, demoParam);
      return demoParam === "true";
    } else if (demoStorage) {
      return demoStorage === "true";
    }
    return environment.demo_mode;
  }

  private static getSession(params: URLSearchParams): SessionType {
    const sessionParam = params.get("session");
    const sessionStorage = localStorage.getItem(this.SESSION_LOCAL_STORAGE_KEY);
    if (sessionParam) {
      localStorage.setItem(this.SESSION_LOCAL_STORAGE_KEY, sessionParam);
      return sessionParam as SessionType;
    } else if (sessionStorage) {
      return sessionStorage as SessionType;
    }
    return environment.session_type;
  }
}
