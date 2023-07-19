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

import { Observable } from "rxjs";

/**
 * An implementation of this abstract class provides functions for direct database access.
 * This interface is an extension of the [PouchDB API](https://pouchdb.com/api.html).
 */
export abstract class Database {
  /**
   * Load a single document by id from the database.
   * @param id The primary key of the document to be loaded
   * @param options Optional options for the database engine (PouchDB)
   */
  abstract get(id: string, options?: GetOptions): Promise<any>;

  /**
   * Load all documents (matching the given PouchDB options) from the database.
   *
   * Normally you should rather use "getAll()" or another well typed method of this class
   * instead of passing PouchDB specific options here
   * because that will make your code tightly coupled with PouchDB rather than any other database provider.
   *
   * @param options PouchDB options object as in the normal PouchDB library
   */
  abstract allDocs(options?: GetAllOptions): Promise<any>;

  /**
   * Save a document to the database.
   * @param object The document to be saved
   * @param forceUpdate (Optional) Whether conflicts should be ignored and an existing conflicting document forcefully overwritten.
   */
  abstract put(object: any, forceUpdate?: boolean): Promise<any>;

  /**
   * Save a bunch of documents at once to the database
   * @param objects The documents to be saved
   * @param forceUpdate (Optional) Whether conflicts should be ignored and existing conflicting documents forcefully overwritten.
   * @returns array holding success responses or errors depending on the success of the operation
   */
  abstract putAll(objects: any[], forceUpdate?: boolean): Promise<any[]>;

  /**
   * Delete a document from the database
   * @param object The document to be deleted (usually this object must at least contain the _id and _rev)
   */
  abstract remove(object: any): Promise<any>;

  /**
   * Query data from the database based on a more complex, indexed request.
   *
   * This is directly calling the PouchDB implementation of this function.
   * Also see the documentation there: {@link https://pouchdb.com/api.html#query_database}
   *
   * @param fun The name of a previously saved database index
   * @param options Additional options for the query, like a `key`. See the PouchDB docs for details.
   */
  abstract query(fun: any, options?: QueryOptions): Promise<any>;

  /**
   * Create a database index to `query()` certain data more efficiently in the future.
   *
   * Also see the PouchDB documentation regarding indices and queries: {@link https://pouchdb.com/api.html#query_database}
   *
   * @param designDoc The PouchDB style design document for the map/reduce query
   */
  abstract saveDatabaseIndex(designDoc: any): Promise<any>;

  /**
   * Load all documents (with the given prefix) from the database.
   * @param prefix The string prefix of document ids that should be retrieved
   */
  getAll(prefix = ""): Promise<Array<any>> {
    return this.allDocs({
      include_docs: true,
      startkey: prefix,
      endkey: prefix + "\ufff0",
    });
  }

  /**
   * @returns true if there are no documents in the database
   */
  abstract isEmpty(): Promise<boolean>;

  /**
   * Closes all open connections to the database base and destroys it (clearing all data)
   */
  abstract destroy(): Promise<any>;

  abstract changes(prefix: string): Observable<any>;
}

/**
 * Basic query options supported by {@link Database}.
 *
 * also see https://pouchdb.com/guides/queries.html
 */
export type QueryOptions = PouchDB.Query.Options<any, any>;

/**
 * Basic database read options supported by {@link Database}.
 *
 * also see https://pouchdb.com/api.html#fetch_document
 */
export type GetAllOptions =
  | PouchDB.Core.AllDocsWithKeyOptions
  | PouchDB.Core.AllDocsWithKeysOptions
  | PouchDB.Core.AllDocsWithinRangeOptions
  | PouchDB.Core.AllDocsOptions;

/**
 * Basic database read options supported by {@link Database}.
 *
 * also see https://pouchdb.com/api.html#fetch_document
 */
export type GetOptions = PouchDB.Core.GetOptions;
