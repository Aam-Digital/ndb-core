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
import { Database, QueryOptions } from "../../database/database";
import { BehaviorSubject, Observable } from "rxjs";
import { BackgroundProcessState } from "../../sync-status/background-process-state.interface";
import { Entity, EntityConstructor } from "../entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { first } from "rxjs/operators";

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
  get indicesRegistered(): Observable<BackgroundProcessState[]> {
    return this._indicesRegistered.asObservable();
  }

  constructor(
    private db: Database,
    private entitySchemaService: EntitySchemaService
  ) {}

  /**
   * Register a new database query to be created/updated and indexed.
   *
   * This also triggers updates to the observable `indicesRegistered`.
   *
   * @param designDoc The design document (see @link{Database}) describing the query/index.
   */
  async createIndex(designDoc: any): Promise<void> {
    const indexState: BackgroundProcessState = {
      title: $localize`Preparing data (Indexing)`,
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
   * @param entityConstructor
   * @param indexName The name of the previously created index to be queried.
   * @param options (Optional) additional query options object or a simple value used as the exact key to retrieve
   */
  async queryIndexDocs<T extends Entity>(
    entityConstructor: EntityConstructor<T>,
    indexName: string,
    options: QueryOptions | string = {}
  ): Promise<T[]> {
    if (typeof options === "string") {
      options = { key: options };
    }
    options.include_docs = true;

    const rawResults = await this.queryIndexRaw(indexName, options);
    return rawResults.rows.map((loadedRecord) => {
      const entity = new entityConstructor("");
      this.entitySchemaService.loadDataIntoEntity(entity, loadedRecord.doc);
      return entity;
    });
  }

  /**
   * Load data from the Database through the given, previously created index for a key range.
   * @param entityConstructor
   * @param indexName The name of the previously created index to be queried.
   * @param startkey
   * @param endkey
   */
  async queryIndexDocsRange<T extends Entity>(
    entityConstructor: EntityConstructor<T>,
    indexName: string,
    startkey: string,
    endkey?: string
  ): Promise<T[]> {
    return this.queryIndexDocs(entityConstructor, indexName, {
      startkey: startkey,
      endkey: endkey + "\ufff0",
    });
  }

  async queryIndexStats(
    indexName: string,
    options: QueryOptions = {
      reduce: true,
      group: true,
    }
  ): Promise<any> {
    return await this.queryIndexRaw(indexName, options);
  }

  /**
   * Run a query on the database.
   * If the required index does not exist (yet) this blocks the request by default
   * and only runs and returns once the index is available.
   *
   * @param indexName key of the database index to be used
   * @param options additional options for the request
   * @param doNotWaitForIndexCreation (Optional) flag to *not* block the query if the index doesn't exist yet.
   *        If no index exists this may result in an error (e.g. 404)
   */
  async queryIndexRaw(
    indexName: string,
    options: QueryOptions,
    doNotWaitForIndexCreation?: boolean
  ): Promise<any> {
    if (!doNotWaitForIndexCreation) {
      await this.waitForIndexAvailable(indexName);
    }

    return await this.db.query(indexName, options);
  }

  /**
   * If the index is not created yet, wait until it is ready to avoid 404 errors.
   * Returns immediately if index is already created.
   * @param indexName
   * @private
   */
  private async waitForIndexAvailable(indexName: string): Promise<void> {
    function relevantIndexIsReady(processes, requiredIndexName) {
      const relevantProcess = processes.find(
        (process) =>
          process.details === requiredIndexName ||
          requiredIndexName.startsWith(process.details + "/")
      );
      return relevantProcess && !relevantProcess.pending;
    }

    if (relevantIndexIsReady(this._indicesRegistered.value, indexName)) {
      return;
    }

    await this._indicesRegistered
      .pipe(first((processes) => relevantIndexIsReady(processes, indexName)))
      .toPromise();
  }
}
