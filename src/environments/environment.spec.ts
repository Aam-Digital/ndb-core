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
import { AuthProvider } from "../app/core/session/auth/auth-provider";

export const environment = {
  production: false,
  appVersion: "test",
  repositoryId: "Aam-Digital/ndb-core",
  demo_mode: false,
  session_type: SessionType.mock,
  authenticator: AuthProvider.CouchDB,
  account_url: "https://accounts.aam-digital.net",
  email: undefined,
};
