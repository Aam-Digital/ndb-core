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

import { Injectable } from "@angular/core";
import { Database } from "../../database/database";
import { BehaviorSubject, Observable } from "rxjs";
import { BackgroundProcessState } from "../../sync-status/background-process-state.interface";

/**
 * Manage database query index creation and use, working as a facade in front of the Database service.
 * This allows to track pending indexing processes and also show them to users in the UI.
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseIndexingService {
  private _indicesRegistered = new BehaviorSubject<BackgroundProcessState[]>(
    []
  );

  /** All currently registered indices with their status */
  public get indicesRegistered(): Observable<BackgroundProcessState[]> {
    return this._indicesRegistered.asObservable();
  }

  constructor(private db: Database) {}

  /**
   * Register a new database query to be created/updated and indexed.
   *
   * This also triggers updates to the observable `indicesRegistered`.
   *
   * @param designDoc The design document (see @link{Database}) describing the query/index.
   */
  public async createIndex(designDoc: any): Promise<void> {
    const indexState: BackgroundProcessState = {
      title: "Preparing data (Indexing)",
      details: designDoc._id.replace(/_design\//, ""),
      pending: true,
    };
    const indexCreationPromise = this.db.saveDatabaseIndex(designDoc);
    this._indicesRegistered.next([
      ...this._indicesRegistered.value,
      indexState,
    ]);

    try {
      await indexCreationPromise;
    } catch (err) {
      indexState.pending = false;
      indexState.error = err;
      this._indicesRegistered.next(this._indicesRegistered.value);
      throw err;
    }

    indexState.pending = false;
    this._indicesRegistered.next(this._indicesRegistered.value);
  }

  /**
   * Load data from the Database through the given, previously created index.
   * @param indexName The name of the previously created index to be queried.
   * @param options Additional query options (see @link{Database})
   */
  public queryIndex(indexName: string, options?: any) {
    return this.db.query(indexName, options);
  }
}
