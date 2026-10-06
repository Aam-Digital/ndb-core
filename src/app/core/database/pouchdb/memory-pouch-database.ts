import { PouchDatabase } from "./pouch-database";
import PouchDB from "pouchdb-browser";
import memory from "pouchdb-adapter-memory";
import { SyncStateSubject } from "app/core/session/session-type";
import { SyncState } from "app/core/session/session-states/sync-state.enum";
import { NgZone } from "@angular/core";
import { FindPage } from "./find-queries";

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
   * Query a page through PouchDB's local Mango engine (see {@link PouchDatabase.find}).
   *
   * {@link supportsFind} stays false on purpose: the local engine has no
   * bookmark cursor, so the opaque bookmark here is the positional offset of
   * the next unseen document. That is enough for a caller which only passes it
   * back unread, but it is not the cursor the remote contract promises, and
   * production code choosing a data source should keep treating this database
   * as one that cannot page.
   */
  protected override async findPage(
    findOptions: PouchDB.Find.FindRequest<any>,
    page?: { limit?: number; bookmark?: string },
  ): Promise<FindPage> {
    const skip = page?.bookmark ? Number(page.bookmark) : 0;
    const request: PouchDB.Find.FindRequest<any> = { ...findOptions, skip };
    if (Number.isInteger(page?.limit)) {
      request.limit = page.limit;
    }

    const pouchDB = await this.getPouchDBOnceReady();
    const res = await pouchDB.find(request);
    return { docs: res.docs, bookmark: String(skip + res.docs.length) };
  }
}
