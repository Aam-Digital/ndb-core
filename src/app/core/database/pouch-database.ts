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

import {Database} from './database';
import {AlertService} from '../alerts/alert.service';
import {AlertDisplay} from '../alerts/alert-display';
import {LoggingService} from '../logging/logging.service';

/**
 * Wrapper for a PouchDB instance to decouple the code from
 * that external library.
 *
 * Additional convenience functions on top of the PouchDB API
 * should be implemented in the abstract `Database` schoolClass.
 */
export class PouchDatabase extends Database {

  constructor(private _pouchDB: any,
              private alertService: AlertService,
  ) {
    super();
  }

  get(id: string) {
    this.alertService.addDebug('DB_READ');
    return this._pouchDB.get(id)
      .catch((err) => {
        this.notifyError(err);
        throw err;
      });
  }

  allDocs(options?: any) {
    this.alertService.addDebug('DB_READ');
    return this._pouchDB.allDocs(options).then(result => {
      const resultArray = [];
      for (const row of result.rows) {
        resultArray.push(row.doc);
      }
      return resultArray;
    });
  }

  allDocsRaw(options?: any) {
    this.alertService.addDebug('DB_READ');
    return this._pouchDB.allDocs(options).then(result => {
      return result;
    });
  }

  put(object: any, forceOverwrite?: boolean) {
    this.alertService.addDebug('DB_WRITE');
    const options: any = {};
    // if (forceOverwrite) {
    //   options.force = true;
    // }

    return this._pouchDB.put(object, options)
      .catch((err) => {
        if (err.status === 409) {
          this.resolveConflict(object, forceOverwrite, err);
        } else {
          this.notifyError(err);
          throw err;
        }
      });
  }

  remove(object: any) {
    return this._pouchDB.remove(object)
      .catch((err) => {
        this.notifyError(err);
        throw err;
      });
  }

  query(fun: (doc: any, emit: any) => void, options: any): Promise<any> {
    this.alertService.addDebug('DB_READ');
    return this._pouchDB.query(fun, options);
  }

  saveDatabaseIndex(designDoc: any): Promise<any> {
    return this.get(designDoc._id)
      .then(existingDoc => {
        if (JSON.stringify(existingDoc.views) !== JSON.stringify(designDoc.views)) {
          designDoc._rev = existingDoc._rev;
          this.alertService.addDebug('replacing existing database index');
          return this.put(designDoc);
        }
      })
      .catch(err => {
        if (err.status === 404) {
          this.alertService.addDebug('creating new database index');
          return this.put(designDoc);
        } else {
          // unexpected error
          this.alertService.addWarning('database index failed to be added: ' + err);
        }
      });
  }


  private notifyError(err) {
    this.alertService.addWarning(err.message + ' (' + err.status + ')', AlertDisplay.NONE);
  }

  private resolveConflict(newObject: any, overwriteChanges: boolean, existingError: any) {
    this.get(newObject._id).then(existingObject => {
      const resolvedObject = this.mergeObjects(existingObject, newObject);
      if (resolvedObject) {
        this.alertService.addDebug('resolved document conflict automatically (' + resolvedObject._id + ')');
        this.put(resolvedObject);
      } else if (overwriteChanges) {
        this.alertService.addDebug('overwriting conflicting document version (' + newObject._id + ')');
        newObject._rev = existingObject._rev;
        this.put(newObject);
      } else {
          existingError.message = existingError.message + ' (unable to resolve)';
          throw existingError;
      }
    });
  }

  private mergeObjects(existingObject: any, newObject: any) {
    // TODO: implement automatic merging of conflicting entity versions
    return undefined;
  }
}
