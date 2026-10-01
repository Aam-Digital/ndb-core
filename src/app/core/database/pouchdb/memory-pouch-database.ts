import { PouchDatabase } from "./pouch-database";
import PouchDB from "pouchdb-browser";
import memory from "pouchdb-adapter-memory";
import { SyncStateSubject } from "app/core/session/session-type";
import { SyncState } from "app/core/session/session-states/sync-state.enum";
import { NgZone } from "@angular/core";

/**
 * An alternative implementation of PouchDatabase that uses the in-memory adapter
 * not persisting any data after the page is closed.
 */
export class MemoryPouchDatabase extends PouchDatabase {
  constructor(
    dbName: string = "in-memory-db",
    globalSyncState: SyncStateSubject,
    ngZone?: NgZone,
  ) {
    super(dbName, globalSyncState, ngZone);
  }

  /**
   * Initialize the PouchDB with the in-memory adapter.
   * See {@link https://github.com/pouchdb/pouchdb/tree/master/packages/node_modules/pouchdb-adapter-memory}
   * @param dbName the name for the database
   */
  override init(dbName?: string) {
    PouchDB.plugin(memory);
    this.pouchDB = new PouchDB(dbName ?? this.dbName, { adapter: "memory" });
    this.databaseInitialized.complete();
    this.globalSyncState.next(SyncState.COMPLETED);
  }

  /**
   * Query a page through PouchDB's local Mango engine.
   *
   * {@link supportsFind} stays false on purpose: the local engine has no
   * bookmark cursor, so the opaque bookmark here is the positional offset of
   * the next unseen document. That is enough for a caller which only passes it
   * back unread, but it is not the cursor the remote contract promises, and
   * production code choosing a data source should keep treating this database
   * as one that cannot page.
   *
   * It is also stricter than CouchDB in one way worth knowing: it sorts only
   * from an index that also covers every filtered field, so sorting on one
   * field while filtering on another is rejected here although a real CouchDB
   * serves it. A caller needing both has to filter on the field it sorts by.
   */
  override async find(
    prefix = "",
    query = {},
    page?: { limit?: number; bookmark?: string },
    sort?: { prop?: string; dir?: "asc" | "desc" },
  ): Promise<{ docs: any[]; bookmark?: string }> {
    const skip = page?.bookmark ? Number(page.bookmark) : 0;
    const findOptions: PouchDB.Find.FindRequest<any> & { skip?: number } = {
      selector: {
        ...query,
        _id: { $lt: `${prefix}:￰`, $gte: `${prefix}:` },
      },
      skip,
    };
    if (Number.isInteger(page?.limit)) {
      findOptions.limit = page.limit;
    }

    const pouchDB = await this.getPouchDBOnceReady();
    if (sort?.prop) {
      // mirrors RemotePouchDatabase: the sort field needs an index, and the
      // type range moves into that index's partial selector
      const indexRes = await pouchDB.createIndex({
        index: {
          name: prefix + "_" + sort.prop,
          partial_filter_selector: {
            _id: findOptions.selector._id,
          },
          fields: [sort.prop],
        },
      });
      delete findOptions.selector._id;
      findOptions.sort = [{ [sort.prop]: sort.dir }];
      findOptions.use_index = indexRes["id"];
    }

    const res = await pouchDB.find(findOptions);
    return { docs: res.docs, bookmark: String(skip + res.docs.length) };
  }
}
