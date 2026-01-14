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
}
