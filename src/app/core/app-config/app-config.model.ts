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

/**
 * Interface to facilitate use of AppConfig.settings.
 *
 * This defines the settings that should be available in the config.json and therefore in the AppConfig.settings.
 * Adapt this interface when you add more config options to the core.
 */
export interface IAppConfig {
  /** Title of the app overall */
  site_name: string;

  /** database configuration */
  database: {
    /** name of the database - both remote and local */
    name: string;

    /**
     * URL to the database server to be synced with
     *
     * Beware of CORS issues if this is on a different domain than the app is served from.
     */
    remote_url: string;

    /** timeout for remote connection attempts */
    timeout: number;

    /**
     * whether to use a temporary in-memory database instead of a persistant and synced PouchDB/CouchDB
     *
     * If this is set to "true" the {@link MockSessionService} and {@link MockDatabase} are used
     * and the {@link DemoDataModule} generates mock data.
     */
    useTemporaryDatabase: boolean;
  };

  /**
   * Optional configuration of a webdav (e.g. Nextcloud) integration
   */
  webdav?: {
    /**
     * URL to the webdav endpoint of the Nextcloud server
     *
     * Beware of CORS issues if this is on a different domain than the app is served from.
     */
    remote_url: string;
  };

  /**
   * Optional flag to activate additional debugging output to troubleshoot problems on a user's device
   */
  debug?: boolean;
}
