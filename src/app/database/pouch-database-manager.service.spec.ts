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

import { TestBed, inject } from '@angular/core/testing';

import { PouchDatabaseManagerService } from './pouch-database-manager.service';

describe('PouchDatabaseManagerService', () => {
  let dbManager: PouchDatabaseManagerService;
  let testConfigService: any;

  beforeEach(() => {
    testConfigService = {
      database: {
        name: 'unit-test',
        remote_url: 'remote-',
        timeout: 60000,
        outdated_threshold_days: 0
      }
    };

    dbManager = new PouchDatabaseManagerService(testConfigService);
  });

  it('returns database', function () {
    const db = dbManager.getDatabase();
    expect(db).toBeDefined();
  });
});
