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

import { environment } from '../../environments/environment';
import { PouchDatabaseManagerService } from './pouch-database-manager.service';
import { ConfigService } from '../config/config.service';
import { MockDatabaseManagerService } from './mock-database-manager.service';
import { DatabaseManagerService } from './database-manager.service';

export function databaseManagerServiceFactory(appConfig: ConfigService): DatabaseManagerService {
  if (environment.production) {
    return new PouchDatabaseManagerService(appConfig);
  } else {
    return new MockDatabaseManagerService();
  }
}

export const databaseManagerProvider = {
  provide: DatabaseManagerService,
  useFactory: databaseManagerServiceFactory,
  deps: [ConfigService]
};
