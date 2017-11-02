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
import { Entity } from '../entity/entity';

declare const require: any;
PouchDB.plugin(require('pouchdb-authentication'));
PouchDB.plugin(require('relational-pouch'));


export class Child extends Entity {

  public name: String;
  public school: School;

  constructor(id: string, name: String, school: School) {
    super(id);
    this.name = name;
  }
}

export class School extends Entity {
  public name: String;
  public children: Child[];

  constructor(id: string, name: String) {
    super(id);
    this.name = name;
  }
}


@Injectable()
export class PouchDatabaseManagerTestService extends DatabaseManagerService {

  private _pouchDatabase: PouchDatabase;
  private _pouchDB: any;

  constructor() {
    super();

    this._pouchDB = new PouchDB('ndb-test2');
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

    this._pouchDB.setSchema([
      {singular: 'User', plural: 'users'},
      {singular: 'child', plural: 'children', relations: {school: {belongsTo: 'school'}}},
      {singular: 'school', plural: 'schools', relations: {children: {hasMany: 'child'}}}
    ]);


    const demoUser = new User('demo');
    demoUser.name = 'demo';
    demoUser.setNewPassword('pass');

    this._pouchDB.rel.save(demoUser);

    this._pouchDatabase.put(demoUser);
    //this._pouchDatabase.get(demoUser.getId()).catch(() => );

    const demoSchool = new School(1, "Some School");
    const demoChild1 = new Child(1, "child1", demoSchool);

    this._pouchDatabase.put(demoSchool);
    this._pouchDatabase.put(demoChild1);

    // TODO put: ids have to be integers, don't need a prefix, relational-pouch will take care of it

    // TODO load: will return a list with related objects, need to find out the type, parse it and add it to the original object manually
    // TODO load alternative: create nested json objects manually by parsing the ids and replacing them with the corresponding json object

  }
}
