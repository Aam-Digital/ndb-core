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

import { PouchDatabaseManagerService } from './pouch-database-manager.service';
import {AppConfig} from '../app-config/app-config';
import {AlertService} from '../alerts/alert.service';

describe('PouchDatabaseManagerService', () => {
  let dbManager: PouchDatabaseManagerService;

  beforeEach(() => {
    AppConfig.settings = {
      database: {
        name: 'unit-test',
        remote_url: 'remote-',
        timeout: 60000,
        outdated_threshold_days: 0
      },
      version: 'x',
      dev: { useRemoteDatabaseDuringDevelopment: false },
    };
    dbManager = new PouchDatabaseManagerService(new AlertService(null));
  });

  it('returns database', function () {
    const db = dbManager.getDatabase();
    expect(db).toBeDefined();
  });
});
