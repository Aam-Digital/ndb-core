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

import PouchDB from "pouchdb-core";
import memory from "pouchdb-adapter-memory";
import mapreduce from "pouchdb-mapreduce";
import { PouchDatabase } from "./pouch-database";
import { LoggingService } from "../logging/logging.service";

/**
 * In-Memory database implementation that works as a drop-in replacement of {@link PouchDatabase}
 *
 * The MockDatabase internally stores all documents in a variable and tries to simulate functionality
 * as similar as possible to the PouchDatabase.
 */
export class MockDatabase extends PouchDatabase {
  static async createWithData(data: any[]) {
    const instance = MockDatabase.createWithPouchDB();
    await Promise.all(data.map((doc) => instance.put(doc)));
    return instance;
  }

  static createWithPouchDB() {
    PouchDB.plugin(memory).plugin(mapreduce);
    return new MockDatabase(new PouchDB("unit-test", { adapter: "memory" }));
  }

  private indexPromises: Promise<any>[] = [];

  /**
   * Create an in-memory database manager.
   */
  constructor(private pouchDB?) {
    super(pouchDB, new LoggingService());
  }

  public saveDatabaseIndex(designDoc: any): Promise<any> {
    const indexPromise = super.saveDatabaseIndex(designDoc);
    this.indexPromises.push(indexPromise);
    return indexPromise;
  }

  /**
   * Returns a promise that will resolve, once all indices are built.
   * This function should be called AFTER saveDatabaseIndex was called for each index.
   * If a second index is saved after the first one is done and this function is called immediately after saving the
   * first index, then the promise will not wait for the second index to be done.
   */
  public waitForIndexing(): Promise<any> {
    return Promise.all(this.indexPromises);
  }

  public destroy(): Promise<any> {
    return this.pouchDB.destroy();
  }
}
