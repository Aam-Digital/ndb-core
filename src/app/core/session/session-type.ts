import { BehaviorSubject } from "rxjs";
import { LoginState } from "./session-states/login-state.enum";
import { Injectable } from "@angular/core";
import { SyncState } from "./session-states/sync-state.enum";

/**
 * Available Session types with their keys that can be used in the app-config.
 */
export enum SessionType {
  /**
   * synced local PouchDB and remote CouchDB connection
   */
  synced = "synced",

  /**
   * online-only mode - direct HTTP to remote CouchDB without local storage or sync
   */
  online = "online",

  /**
   * local only demo mode - PouchDB database without a remote sync counterpart
   */
  local = "local",

  /**
   * in-memory adapter of pouchdb database - data is lost after leaving the page
   */
  mock = "mock",
}

/**
 * Check whether the given session type has a remote server connection.
 * This is true for both "synced" (local+remote) and "online" (remote-only) modes.
 */
export function hasRemoteSession(sessionType: SessionType): boolean {
  return (
    sessionType === SessionType.synced || sessionType === SessionType.online
  );
}

@Injectable()
export class LoginStateSubject extends BehaviorSubject<LoginState> {
  constructor() {
    super(LoginState.LOGGED_OUT);
  }
}

/**
 * State of synchronization with server-side database
 * for the main "app" database.
 *
 * (other databases are currently not covered by this sync state)
 */
@Injectable()
export class SyncStateSubject extends BehaviorSubject<SyncState> {
  constructor() {
    super(SyncState.UNSYNCED);
  }
}
