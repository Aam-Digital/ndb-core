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

import { environment } from "../../environments/environment";

/**
 * Central static app settings.
 * More dynamic settings can be found in the environment.ts file.
 */
export class AppSettings {
  /** Path for the reverse proxy that forwards to the database - configured in `proxy.conf.json` and `default.conf` */
  static readonly DB_PROXY_PREFIX = "/db";
  /** Name of the database that is used */
  static readonly DB_NAME = "app";

  /** file location of the config file to be created by the administrator */
  private static readonly CONFIG_FILE = "assets/config.json";

  /**
   * Overwrite environment settings with the settings from the `config.json` if present.
   * If no file is found, the environment settings are kept.
   **/
  static initRuntimeSettings(): Promise<void> {
    return fetch(this.CONFIG_FILE)
      .then((res) => res.json())
      .then((res) => Object.assign(environment, res));
  }
}
