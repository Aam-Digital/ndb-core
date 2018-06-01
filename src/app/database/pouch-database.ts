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
export class PouchDatabase extends Database {

  constructor(private _pouchDB: any) {
    super();
  }

  get(id: string) {
    return this._pouchDB.get(id);
  }

  allDocs(options?: any) {
    return this._pouchDB.allDocs(options).then(result => {
      const resultArray = [];
      for (const row of result.rows) {
        resultArray.push(row.doc);
      }
      return resultArray;
    });
  }

  put(object: any) {
    return this._pouchDB.put(object);
  }

  remove(object: any) {
    return this._pouchDB.remove(object);
  }

  query(fun: (doc: any, emit: any) => void, options: any): Promise<any> {
    return this._pouchDB.query(fun, options);
  }

  saveDatabaseIndex(designDoc: any): Promise<any> {
    return this.put(designDoc)
      .catch(err => {
        if (err.status === 409) {
          return this.updateIndexIfChanged(designDoc);
        } else {
          // unexpected error
          // TODO: should error reports go to a service instead of just/directly to console?
          console.warn('database index failed to be added: ', err);
        }
      });
  }

  private updateIndexIfChanged(doc): Promise<any> {
    return this.get(doc._id)
      .then(existingDoc => {
        if (JSON.stringify(existingDoc.views) !== JSON.stringify(doc.views)) {
          doc._rev = existingDoc._rev;
          console.log('replacing existing database index');
          return this.saveDatabaseIndex(doc);
        }
      })
  }
}
