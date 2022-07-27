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
 * Some settings are fixed, others can be changed at runtime.
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

  /** Demo mode and session type can be persisted in local storage */
  private static readonly DEMO_MODE_KEY = "demo_mode";
  private static readonly SESSION_TYPE_KEY = "session_type";

  /**
   * Initializes settings that can be changed at runtime.
   */
  static initSettings() {
    const demoMode = this.getSetting(this.DEMO_MODE_KEY);
    this.DEMO_MODE = demoMode === "true";
    const sessionType = this.getSetting(this.SESSION_TYPE_KEY);
    this.SESSION_TYPE = sessionType as SessionType;
  }

  /**
   * A setting can be applied through the url params, the local storage and the environment.
   * If params are found in the URL query params, then they are persisted in the local storage.
   *
   * The settings are checked and used in the following order:
   * 1. URL params
   * 2. Local storage
   * 3. Environment
   *
   * @param key The key of the setting
   * @returns first value of the setting
   * @private
   */
  private static getSetting(key: string): string {
    const paramValue = new URLSearchParams(location.search).get(key);
    const localStorageValue = localStorage.getItem(this.SESSION_TYPE_KEY);
    if (paramValue) {
      localStorage.setItem(key, paramValue);
      return paramValue;
    } else if (localStorageValue) {
      return localStorageValue;
    } else {
      return environment[key];
    }
  }
}
