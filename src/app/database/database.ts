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

/**
 * An implementation of this interface provides functions for direct database access.
 * The interface is an extension of the [PouchDB API](https://pouchdb.com/api.html).
 * A `Database` instance is injected into the app through `DatabaseManagerService`.
 */
export abstract class Database {

  abstract get(id: string): Promise<any>;

  abstract allDocs(options?: any): Promise<any>;

  abstract put(object: any, forceUpdate?: boolean): Promise<any>;

  abstract remove(object: any): Promise<any>;

  abstract query(fun: any, options?: any): Promise<any>;
  abstract saveDatabaseIndex(designDoc: any): Promise<any>;

  getAll(prefix = ''): Promise<Array<any>> {
    return this.allDocs({include_docs: true, startkey: prefix, endkey: prefix + '\ufff0'});
  }
}
