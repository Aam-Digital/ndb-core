import { PouchDatabase } from "./pouch-database";
import PouchDB from "pouchdb-browser";
import memory from "pouchdb-adapter-memory";
import { SyncStateSubject } from "app/core/session/session-type";
import { SyncState } from "app/core/session/session-states/sync-state.enum";
import { NgZone } from "@angular/core";
import { findSorted, RunFind, typeSelector } from "./find-sorted";

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
   * Sorting works the same as in RemotePouchDatabase (see {@link findSorted}).
   */
  override async find(
    prefix = "",
    query = {},
    page?: { limit?: number; bookmark?: string },
    sort?: { prop?: string; dir?: "asc" | "desc" },
  ): Promise<{ docs: any[]; bookmark?: string }> {
    const pouchDB = await this.getPouchDBOnceReady();
    const runFind: RunFind = async (
      findOptions: PouchDB.Find.FindRequest<any> & { skip?: number },
      limit,
      bookmark,
    ) => {
      const skip = bookmark ? Number(bookmark) : 0;
      findOptions.skip = skip;
      if (Number.isInteger(limit)) {
        findOptions.limit = limit;
      }
      const res = await pouchDB.find(findOptions);
      return { docs: res.docs, bookmark: String(skip + res.docs.length) };
    };

    if (!sort?.prop) {
      return runFind(
        { selector: { ...query, ...typeSelector(prefix) } },
        page?.limit,
        page?.bookmark,
      );
    }

    return findSorted(
      { createIndex: (index) => pouchDB.createIndex(index), runFind },
      prefix,
      query,
      { prop: sort.prop, dir: sort.dir },
      page,
    );
  }
}
