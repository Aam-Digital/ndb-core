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
    const index = this.data.findIndex(o => o._id === id);
    if (index > -1) {
      const result = this.data[index];
      return Promise.resolve(result);
    }

    return Promise.reject({'status': 404, 'message': 'object not found'});
  }

  allDocs(options?: any) {
    const result = this.data;

    return Promise.resolve(result);
  }

  put(object: any) {
    const result = this.data.push(object);

    return Promise.resolve(result);
  }

  remove(object: any) {
    const index = this.data.indexOf(object);
    if (index > -1) {
      this.data.splice(index, 1);
    }

    return Promise.resolve(true);
  }
}
