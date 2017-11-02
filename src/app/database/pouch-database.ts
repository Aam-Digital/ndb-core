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

import { Database } from './database';
import { Entity } from '../entity/entity';
import { serialize } from 'class-transformer';

/**
 * Wrapper for a PouchDB instance to decouple the code from
 * that external library.
 *
 * Additional convenience functions on top of the PouchDB API
 * should be implemented in the abstract `Database` class.
 */
export class PouchDatabase extends Database {

  constructor(private _pouchDB: any) {
    super();
  }

  get(type: string, id: string) {
    return this._pouchDB.rel.find(type, id);
  }

  allDocs(options?: any) {
    return this._pouchDB.allDocs(options);
  }

  put(entity: Entity) {
    return this._pouchDB.rel.save(entity.getType(), serialize(entity));
  }

  remove(object: any) {
    return this._pouchDB.remove(object);
  }
}
