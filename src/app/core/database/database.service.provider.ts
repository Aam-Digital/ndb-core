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

import { Database } from "./database";
import { SessionService } from "../session/session-service/session.service";

/**
 * Provider of Database service for the Angular dependency injection.
 *
 * This depends on the SessionService that is set up
 * (which in turn considers the app-config.json to switch between an in-memory database and a synced persistent database).
 */
export let databaseServiceProvider = {
  provide: Database,
  useFactory: function (_sessionService: SessionService) {
    return _sessionService.getDatabase();
  },
  deps: [SessionService],
};
