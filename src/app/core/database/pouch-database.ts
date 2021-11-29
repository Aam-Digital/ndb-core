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

import { Database, GetAllOptions, GetOptions, QueryOptions } from "./database";
import { LoggingService } from "../logging/logging.service";
import PouchDB from "pouchdb-browser";
import memory from "pouchdb-adapter-memory";
import { PerformanceAnalysisLogging } from "../../utils/performance-analysis-logging";
import { Injectable } from "@angular/core";

@Injectable()
/**
 * Wrapper for a PouchDB instance to decouple the code from
 * that external library.
 *
 * Additional convenience functions on top of the PouchDB API
 * should be implemented in the abstract {@link Database}.
 */
export class PouchDatabase extends Database {
  /**
   * Creates a PouchDB in-memory instance in which the passed documents are saved.
   * The functions returns immediately but the documents are saved asynchronously.
   * In tests use `tick()` or `waitForAsync()` to prevent accessing documents before they are saved.
   * @param data an array of documents
   */
  static createWithData(data: any[]): PouchDatabase {
    const instance = new PouchDatabase();
    instance.initInMemoryDB();
    data.forEach((doc) => instance.put(doc, true));
    return instance;
  }

  private pouchDB: PouchDB.Database;
  private indexPromises: Promise<any>[] = [];

  /**
   * Create a PouchDB database manager.
   * @param loggingService The LoggingService instance of the app to log and report problems.
   */
  constructor(private loggingService: LoggingService = new LoggingService()) {
    super();
  }

  /**
   * Initialize the PouchDB with the in-memory adapter.
   * See {@link https://github.com/pouchdb/pouchdb/tree/master/packages/node_modules/pouchdb-adapter-memory}
   * @param dbName the name for the database
   */
  initInMemoryDB(dbName = "in-memory-database"): PouchDatabase {
    PouchDB.plugin(memory);
    this.pouchDB = new PouchDB(dbName, { adapter: "memory" });
    return this;
  }

  /**
   * Initialize the PouchDB with the IndexedDB/in-browser adapter (default).
   * See {link https://github.com/pouchdb/pouchdb/tree/master/packages/node_modules/pouchdb-browser}
   * @param dbName the name for the database under which the IndexedDB entries will be created
   */
  initIndexedDB(dbName = "indexed-database"): PouchDatabase {
    this.pouchDB = new PouchDB(dbName);
    return this;
  }

  /**
   * Get the actual instance of the PouchDB
   */
  getPouchDB(): PouchDB.Database {
    return this.pouchDB;
  }

  /**
   * Load a single document by id from the database.
   * (see {@link Database})
   * @param id The primary key of the document to be loaded
   * @param options Optional PouchDB options for the request
   * @param returnUndefined (Optional) return undefined instead of throwing error if doc is not found in database
   */
  get(
    id: string,
    options: GetOptions = {},
    returnUndefined?: boolean
  ): Promise<any> {
    return this.pouchDB.get(id, options).catch((err) => {
      if (err.status === 404) {
        this.loggingService.debug("Doc not found in database: " + id);
        if (returnUndefined) {
          return undefined;
        }
      }
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
  allDocs(options?: GetAllOptions) {
    return this.pouchDB.allDocs(options).then((result) => {
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
  put(object: any, forceOverwrite?: boolean): Promise<any> {
    const options: any = {};
    if (forceOverwrite) {
      object._rev = undefined;
    }

    return this.pouchDB.put(object, options).catch((err) => {
      if (err.status === 409) {
        return this.resolveConflict(object, forceOverwrite, err);
      } else {
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
    return this.pouchDB.remove(object).catch((err) => {
      throw err;
    });
  }

  /**
   * Sync the local database with a remote database.
   * See {@Link https://pouchdb.com/guides/replication.html}
   * @param remoteDatabase the PouchDB instance of the remote database
   */
  sync(remoteDatabase) {
    return this.pouchDB.sync(remoteDatabase, {
      batch_size: 500,
    });
  }

  public async destroy(): Promise<any> {
    await Promise.all(this.indexPromises);
    return this.pouchDB.destroy();
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
  query(
    fun: string | ((doc: any, emit: any) => void),
    options: QueryOptions
  ): Promise<any> {
    return this.pouchDB.query(fun, options);
  }

  /**
   * Create a database index to `query()` certain data more efficiently in the future.
   * (see {@link Database})
   *
   * Also see the PouchDB documentation regarding indices and queries: {@link https://pouchdb.com/api.html#query_database}
   *
   * @param designDoc The PouchDB style design document for the map/reduce query
   */
  saveDatabaseIndex(designDoc: any): Promise<void> {
    const creationPromise = this.createOrUpdateDesignDoc(designDoc);
    this.indexPromises.push(creationPromise);
    return creationPromise;
  }

  private async createOrUpdateDesignDoc(designDoc): Promise<void> {
    const existingDesignDoc = await this.get(designDoc._id, {}, true);
    if (!existingDesignDoc) {
      this.loggingService.debug("creating new database index");
    } else if (
      JSON.stringify(existingDesignDoc.views) !==
      JSON.stringify(designDoc.views)
    ) {
      this.loggingService.debug("replacing existing database index");
      designDoc._rev = existingDesignDoc._rev;
    } else {
      // already up to date, nothing more to do
      return;
    }

    await this.put(designDoc);

    await this.prebuildViewsOfDesignDoc(designDoc);
  }

  @PerformanceAnalysisLogging
  private async prebuildViewsOfDesignDoc(designDoc: any): Promise<void> {
    for (const viewName of Object.keys(designDoc.views)) {
      const queryName = designDoc._id.replace(/_design\//, "") + "/" + viewName;
      await this.query(queryName, { key: "1" });
    }
  }

  /**
   * Attempt to intelligently resolve conflicting document versions automatically.
   * @param newObject
   * @param overwriteChanges
   * @param existingError
   */
  private async resolveConflict(
    newObject: any,
    overwriteChanges: boolean,
    existingError: any
  ): Promise<any> {
    const existingObject = await this.get(newObject._id);
    const resolvedObject = this.mergeObjects(existingObject, newObject);
    if (resolvedObject) {
      this.loggingService.debug(
        "resolved document conflict automatically (" + resolvedObject._id + ")"
      );
      return this.put(resolvedObject);
    } else if (overwriteChanges) {
      this.loggingService.debug(
        "overwriting conflicting document version (" + newObject._id + ")"
      );
      newObject._rev = existingObject._rev;
      return this.put(newObject);
    } else {
      existingError.message = existingError.message + " (unable to resolve)";
      existingError.affectedDocument = newObject._id;
      throw existingError;
    }
  }

  private mergeObjects(existingObject: any, newObject: any) {
    // TODO: implement automatic merging of conflicting entity versions
    return undefined;
  }
}
