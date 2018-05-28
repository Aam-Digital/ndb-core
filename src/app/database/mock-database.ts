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

/**
 * Wrapper for a PouchDB instance to decouple the code from
 * that external library.
 *
 * Additional convenience functions on top of the PouchDB API
 * should be implemented in the abstract `Database` class.
 */
export class MockDatabase extends Database {
  private data = [];

  constructor() {
    super();
  }


  get(id: string) {
    if (!this.exists(id)) {
      return Promise.reject({'status': 404, 'message': 'object not found'});
    }

    const index = this.findIndex(id);
    const result = this.data[index];

    return Promise.resolve(result);
  }

  allDocs(options?: any) {
    let result = this.data;

    // default options provided through getAll(prefix): {include_docs: true, startkey: prefix, endkey: prefix + '\ufff0'}
    // MockDatabase ignores endkey and only implements filtering based on startkey/prefix
    if (options && options.hasOwnProperty('startkey')) {
      result = this.data.filter(o => o._id.startsWith(options.startkey));
    }

    return Promise.resolve(result);
  }

  put(object: any) {
    // check if unintentionally (no _rev) a duplicate _id is used
    if (!object._rev && this.exists(object._id)) {
      return Promise.reject({ 'message': '_id already exists'});
    }

    object._rev = true;
    const result = this.data.push(object);

    return Promise.resolve(result);
  }

  remove(object: any) {
    if (!this.exists(object._id)) {
      return Promise.reject({'status': 404, 'message': 'object not found'});
    }

    const index = this.findIndex(object._id);
    if (index > -1) {
      this.data.splice(index, 1);
    }

    return Promise.resolve(true);
  }

  private exists(id: string) {
    return (this.findIndex(id) > -1);
  }

  private findIndex(id: string) {
    return this.data.findIndex(o => o._id === id);
  }


  query(fun: (doc: any, emit: any) => void, options: any): Promise<any> {
    // TODO: implement mock query
    return Promise.reject('not supported');
  }
  saveDatabaseIndex(designDoc) {
    // TODO: implement mock query
    return Promise.reject('not supported');
  }
}
