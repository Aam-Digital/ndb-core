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

import { Database } from "./database";
import { AlertService } from "../alerts/alert.service";
import { AlertDisplay } from "../alerts/alert-display";

/**
 * Wrapper for a PouchDB instance to decouple the code from
 * that external library.
 *
 * Additional convenience functions on top of the PouchDB API
 * should be implemented in the abstract {@link Database}.
 */
export class PouchDatabase extends Database {
  /**
   * Create a PouchDB database manager.
   * @param _pouchDB An (initialized) PouchDB database instance from the PouchDB library.
   * @param alertService The AlertService instance of the app to be able to report problems.
   */
  constructor(private _pouchDB: any, private alertService: AlertService) {
    super();
  }

  /**
   * Load a single document by id from the database.
   * (see {@link Database})
   * @param id The primary key of the document to be loaded
   * @param options Optional PouchDB options for the request
   */
  get(id: string, options: any = {}) {
    return this._pouchDB.get(id, options).catch((err) => {
      this.notifyError(err);
      throw err;
    });
  }

  /**
   * Load all documents (matching the given PouchDB options) from the database.
   * (see {@link Database})
   *
   * Normally you should rather use "getAll()" or another well typed method of this class
   * instead of passing PouchDB specific options here
   * because that will make your code tightly coupled with PouchDB rather than any other database provider.
   *
   * @param options PouchDB options object as in the normal PouchDB library
   */
  allDocs(options?: any) {
    return this._pouchDB.allDocs(options).then((result) => {
      const resultArray = [];
      for (const row of result.rows) {
        resultArray.push(row.doc);
      }
      return resultArray;
    });
  }

  /**
   * Save a document to the database.
   * (see {@link Database})
   *
   * @param object The document to be saved
   * @param forceOverwrite (Optional) Whether conflicts should be ignored and an existing conflicting document forcefully overwritten.
   */
  put(object: any, forceOverwrite?: boolean) {
    const options: any = {};
    // if (forceOverwrite) {
    //   options.force = true;
    // }

    return this._pouchDB.put(object, options).catch((err) => {
      if (err.status === 409) {
        this.resolveConflict(object, forceOverwrite, err);
      } else {
        this.notifyError(err);
        throw err;
      }
    });
  }

  /**
   * Delete a document from the database
   * (see {@link Database})
   *
   * @param object The document to be deleted (usually this object must at least contain the _id and _rev)
   */
  remove(object: any) {
    return this._pouchDB.remove(object).catch((err) => {
      this.notifyError(err);
      throw err;
    });
  }

  /**
   * Query data from the database based on a more complex, indexed request.
   * (see {@link Database})
   *
   * This is directly calling the PouchDB implementation of this function.
   * Also see the documentation there: {@link https://pouchdb.com/api.html#query_database}
   *
   * @param fun The name of a previously saved database index
   * @param options Additional options for the query, like a `key`. See the PouchDB docs for details.
   */
  query(fun: (doc: any, emit: any) => void, options: any): Promise<any> {
    return this._pouchDB.query(fun, options);
  }

  /**
   * Create a database index to `query()` certain data more efficiently in the future.
   * (see {@link Database})
   *
   * Also see the PouchDB documentation regarding indices and queries: {@link https://pouchdb.com/api.html#query_database}
   *
   * @param designDoc The PouchDB style design document for the map/reduce query
   */
  saveDatabaseIndex(designDoc: any): Promise<any> {
    return this.get(designDoc._id)
      .then((existingDoc) => {
        if (
          JSON.stringify(existingDoc.views) !== JSON.stringify(designDoc.views)
        ) {
          designDoc._rev = existingDoc._rev;
          this.alertService.addDebug("replacing existing database index");
          return this.put(designDoc);
        }
      })
      .catch((err) => {
        if (err.status === 404) {
          this.alertService.addDebug("creating new database index");
          return this.put(designDoc);
        } else {
          // unexpected error
          this.alertService.addWarning(
            "database index failed to be added: " + err
          );
        }
      });
  }

  private notifyError(err) {
    this.alertService.addWarning(
      "PouchDB Error " + err.status + ": " + JSON.stringify(err),
      AlertDisplay.NONE
    );
  }

  /**
   * Attempt to intelligently resolve conflicting document versions automatically.
   * @param newObject
   * @param overwriteChanges
   * @param existingError
   */
  private resolveConflict(
    newObject: any,
    overwriteChanges: boolean,
    existingError: any
  ) {
    this.get(newObject._id).then((existingObject) => {
      const resolvedObject = this.mergeObjects(existingObject, newObject);
      if (resolvedObject) {
        this.alertService.addDebug(
          "resolved document conflict automatically (" +
            resolvedObject._id +
            ")"
        );
        this.put(resolvedObject);
      } else if (overwriteChanges) {
        this.alertService.addDebug(
          "overwriting conflicting document version (" + newObject._id + ")"
        );
        newObject._rev = existingObject._rev;
        this.put(newObject);
      } else {
        existingError.message = existingError.message + " (unable to resolve)";
        throw existingError;
      }
    });
  }

  private mergeObjects(existingObject: any, newObject: any) {
    // TODO: implement automatic merging of conflicting entity versions
    return undefined;
  }
}
