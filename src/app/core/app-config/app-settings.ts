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

import { environment } from "../../../environments/environment";

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

  /** fallback file location of the config that is part of the project already if the "real" config file isn't found */
  private static readonly DEFAULT_CONFIG_FILE = "assets/config.default.json";

  /**
   * Load the config file into the `AppConfig.settings` so they can be used synchronously anywhere in the code after that.
   *
   * If the config file does not exist, uses the default config as a fallback.
   */
  static async initRuntimeSettings() {
    const res = await fetch(this.CONFIG_FILE)
      .catch(() => fetch(this.DEFAULT_CONFIG_FILE))
      .then((result) => result.json());
    environment.demo_mode = res.demo_mode;
    environment.session_type = res.session_type;
  }
}
