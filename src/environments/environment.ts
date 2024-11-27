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

import { SessionType } from "../app/core/session/session-type";

/**
 * Central environment that allows to configure differences between a "dev" and a "prod" build.
 * For deployments, the `assets/config.json` can be used to override these settings as well.
 *
 * The file contents for the current environment will overwrite these during build.
 * The build system defaults to the dev environment which uses `environment.ts`, but if you do
 * `ng build --env=prod` then `environment.prod.ts` will be used instead.
 * The list of which env maps to which file can be found in `.angular-cli.json`.
 */
export const environment = {
  production: false,
  appVersion: "0.0.0", // replaced automatically during docker build
  repositoryId: "Aam-Digital/ndb-core",
  remoteLoggingDsn: undefined, // only set for production mode in environment.prod.ts

  demo_mode: true,
  session_type: SessionType.mock,
  account_url: "https://accounts.aam-digital.net",
  email: undefined,

  /** Path for the reverse proxy that forwards to the database - configured in `proxy.conf.json` and `default.conf` */
  DB_PROXY_PREFIX: "/db",

  /** Name of the database that is used */
  DB_NAME: "app",

  firebase: {
    apiKey: "AIzaSyC8PIhZ2VZ5sDmXHWp1V0LmhTfRghBOLGI",
    authDomain: "push-notification-37d2a.firebaseapp.com",
    projectId: "push-notification-37d2a",
    storageBucket: "push-notification-37d2a.firebasestorage.app",
    messagingSenderId: "762806445328",
    appId: "1:762806445328:web:10800dabfd5ad8bf5c3195",
    measurementId: "G-9Z03T96S55",
    vapidKey: "BFgQRW-eKhlLCLl0LCNosL45V_s6H28XQj0z_7uMwka21OY6ENh3WDCCIRzwYcJemsVr-1KxdmbCVV5BfCc3BQQ"
  },
};
