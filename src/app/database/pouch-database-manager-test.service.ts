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
import { PouchDatabase } from './pouch-database';
import * as PouchDB from 'pouchdb';
import { Database } from './database';
import {Child} from '../children/child';
import {School} from '../school/school';
import {Guardian} from '../guardians/guardian';
import { isNullOrUndefined } from 'util';

@Injectable()
export class PouchDatabaseManagerTestService extends DatabaseManagerService {

  private _pouchDatabase: PouchDatabase;
  private _pouchDB: any;

  constructor() {
    super();

    this._pouchDB = new PouchDB('ndb-test');
    this._pouchDatabase = new PouchDatabase(this._pouchDB);
    this.initDB();
  }

  login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  logout(): void {
  }

  getDatabase(): Database {
    return this._pouchDatabase;
  }

  private initDB(): void {
    const demoUser = new User('demo');
    demoUser.name = 'demo';
    demoUser.setNewPassword('pass');

    const demoChild1 = new Child('child');
    demoChild1.setName("Fabian Kneissl");
    demoChild1.setReligion("katholisch");
    demoChild1.setPN(3);
    demoChild1.setPoB("Stuttgart");
    demoChild1.setGender(true);
    demoChild1.setDoB("30.12.1995");

    const demoChild2 = new Child('child');
    demoChild1.setName("Jonas Mügge");
    demoChild1.setReligion("kA");
    demoChild1.setPN(4);
    demoChild1.setPoB("Paderborn");
    demoChild1.setGender(true);
    demoChild1.setDoB("01.01.2000");

    const demoSchool = new School("KIT", "German");
    const demoGuardian = new Guardian ("Max Mustermann", "Father", "01.01.1995", "+49176444110101", "No Remarks");

    
    this._pouchDatabase.get(demoUser.getId()).catch(() => this._pouchDatabase.put(demoUser));
  }
}
