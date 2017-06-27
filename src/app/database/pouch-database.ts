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
    return this._pouchDB.allDocs(options);
  }

  put(object: any) {
    return this._pouchDB.put(object);
  }

  remove(object: any) {
    return this._pouchDB.remove(object);
  }
}
