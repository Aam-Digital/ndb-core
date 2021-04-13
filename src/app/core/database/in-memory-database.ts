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
export class InMemoryDatabase extends PouchDatabase {
  static async createWithData(data: any[]): Promise<InMemoryDatabase> {
    const instance = InMemoryDatabase.create();
    await Promise.all(data.map((doc) => instance.put(doc)));
    return instance;
  }

  static create(
    dbname: string = "in-memory-database",
    loggingService: LoggingService = new LoggingService()
  ): InMemoryDatabase {
    PouchDB.plugin(memory).plugin(mapreduce);
    return new InMemoryDatabase(
      new PouchDB(dbname, { adapter: "memory" }),
      loggingService
    );
  }
}
