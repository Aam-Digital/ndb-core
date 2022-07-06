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

import { IAppConfig } from "./app-config.model";
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

  static DEMO_MODE = false;
  static SESSION_TYPE = SessionType.synced;
  /** settings for the app */
  static settings: IAppConfig;

  /** file location of the config file to be created by the administrator */
  private static readonly CONFIG_FILE = "assets/config.json";

  /** fallback file location of the config that is part of the project already if the "real" config file isn't found */
  private static readonly DEFAULT_CONFIG_FILE = "assets/config.default.json";

  /**
   * Load the config file into the `AppConfig.settings` so they can be used synchronously anywhere in the code after that.
   *
   * If the config file does not exist, uses the default config as a fallback.
   */
  static load(): Promise<IAppConfig> {
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
    console.log("params", demoMode, sessionType);
    return this.loadAppConfigJson(this.CONFIG_FILE).catch(() =>
      this.loadAppConfigJson(this.DEFAULT_CONFIG_FILE)
    );
  }

  /**
   * Load the given file and set it as AppConfig.settings.
   *
   * This requires a HTTP request because the "assets" folder including the config.json is on our server
   * while this javascript code is executed in the users browser.
   *
   * @param jsonFileLocation The file path of the json file to be loaded as config
   */
  private static loadAppConfigJson(
    jsonFileLocation: string
  ): Promise<IAppConfig> {
    return fetch(jsonFileLocation)
      .then((result) => result.json())
      .then((result: IAppConfig) => (AppConfig.settings = result))
      .catch((response: any) => {
        throw new Error(
          `Could not load file '${jsonFileLocation}': ${JSON.stringify(
            response
          )}`
        );
      });
  }
}
