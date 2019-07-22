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

import { Injectable } from '@angular/core';
import { DatabaseManagerService } from './database-manager.service';
import { User } from '../user/user';
import { Database } from './database';
import {MockDatabase} from './mock-database';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {DatabaseSyncStatus} from './database-sync-status.enum';
import {DemoData} from './demo-data';
import {EntitySchemaService} from '../entity/schema/entity-schema.service';

@Injectable()
export class MockDatabaseManagerService extends DatabaseManagerService {

  private database: MockDatabase;


  constructor() {
    super();

    this.database = new MockDatabase();
    this.initDemoData();
  }

  // TODO: move demo data generation to a separate service
  private initDemoData() {
    const entityMapper = new EntityMapperService(this.database, new EntitySchemaService());

    // add demo user
    const demoUser = new User('demo');
    demoUser.name = 'demo';
    demoUser.setNewPassword('pass');
    entityMapper.save(demoUser);

    DemoData.getAllDemoEntities()
      .forEach(c => entityMapper.save(c));
  }


  login(username: string, password: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  logout(): void {
  }

  getDatabase(): Database {
    return this.database;
  }


  triggerSyncStatusChanged(status: DatabaseSyncStatus) {
    this.onSyncStatusChanged.emit(status);
  }

}
