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

import { Database, GetAllOptions, QueryOptions } from "./database";
import { DesignDoc } from "../entity/database-indexing/database-indexing.service";

/**
 * In-Memory database implementation that works as a drop-in replacement of {@link PouchDatabase}
 *
 * The MockDatabase internally stores all documents in a variable and tries to simulate functionality
 * as similar as possible to the PouchDatabase.
 */
export class MockDatabase extends Database {
  static createWithData(data: any[]) {
    const instance = new MockDatabase();
    instance.data = data;
    return instance;
  }

  private views: { [key: string]: { map: string; reduce?: string } } = {};
  private data = [];

  /**
   * Create an in-memory database manager.
   */
  constructor() {
    super();
  }

  /**
   * see {@link Database}
   * @param id The primary id of the document
   */
  async get(id: string): Promise<any> {
    if (!this.exists(id)) {
      throw {
        status: 404,
        message: "object with id " + id + " not found",
      };
    }

    const index = this.findIndex(id);
    return this.data[index];
  }

  /**
   * see {@link Database}
   * @param options Only 'startkey' is considered by the MockDatabase implementation
   */
  allDocs(options?: GetAllOptions) {
    let result = this.data;

    // default options provided through getAll(prefix): {include_docs: true, startkey: prefix, endkey: prefix + '\ufff0'}
    // MockDatabase ignores endkey and only implements filtering based on startkey/prefix
    if (options && "startkey" in options) {
      result = this.data.filter((o) => o._id.startsWith(options.startkey));
    }

    return Promise.resolve(result);
  }

  /**
   * see {@link Database}
   * @param object The document to be saved
   * @param forceUpdate Whether a conflicting document will be forcefully overwritten
   */
  async put(object: any, forceUpdate?: boolean) {
    if (this.exists(object._id)) {
      return this.overwriteExisting(object);
    } else {
      object._rev = "x";
      this.data.push(object);
      return Promise.resolve(this.generateWriteResponse(object));
    }
  }

  private async overwriteExisting(object: any): Promise<any> {
    const existingObject = await this.get(object._id);

    if (object._rev !== existingObject._rev) {
      return Promise.reject({ message: "_id already exists" });
    }

    const index = this.data.findIndex((e) => e._id === object._id);
    if (index > -1) {
      object._rev = object._rev + "x";
      this.data[index] = object;
      return Promise.resolve(this.generateWriteResponse(object));
    } else {
      return Promise.reject({ message: "failed to overwrite existing object" });
    }
  }

  private generateWriteResponse(writtenObject: any) {
    return {
      ok: true,
      id: writtenObject._id,
      rev: writtenObject._rev,
    };
  }

  /**
   * see {@link Database}
   * @param object The document to be deleted
   */
  async remove(object: any): Promise<boolean> {
    if (!this.exists(object._id)) {
      throw { status: 404, message: "object not found" };
    }

    const index = this.findIndex(object._id);
    if (index > -1) {
      this.data.splice(index, 1);
    }

    return true;
  }

  private exists(id: string) {
    return this.findIndex(id) > -1;
  }

  private findIndex(id: string) {
    return this.data.findIndex((o) => o._id === id);
  }

  /**
   * This has hard-coded response logic for some individual indices that are used in the app
   * and at the moment cannot handle generic creating and executing real queries.
   * You can add a mock implementation here for your specific query/index if necessary.
   *
   * @param fun The name of the previously created index
   * @param options Additional options for the query
   */
  async query(fun: any, options?: QueryOptions): Promise<any> {
    const view = this.views[fun];
    const documents: { key: any; val: any }[] = [];
    for (let doc of this.data) {
      const emit = (key, val = doc) => documents.push({ key: key, val: val });
      eval(view.map)(doc);
    }
    documents.sort((d1, d2) => {
      if (d1.key < d2.key) {
        return -1;
      } else if (d1.key > d2.key) {
        return 1;
      } else {
        return 0;
      }
    });

    // TODO improve performance
    // TODO add reduce support

    return {
      rows: documents.map((doc) => {
        return { id: doc.val._id, doc: doc.val };
      }),
    };
  }

  /**
   * Check (and extend) the `query` method for hard-coded mocks of some specific queries.
   *
   * @param designDoc
   */
  saveDatabaseIndex(designDoc: DesignDoc) {
    for (let view in designDoc.views) {
      const viewName = designDoc._id.split("/")[1] + "/" + view;
      this.views[viewName] = designDoc.views[view];
    }
    return Promise.resolve({});
  }
}
