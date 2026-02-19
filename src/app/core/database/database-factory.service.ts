import { inject, Injectable, NgZone } from "@angular/core";
import { Database } from "./database";
import { PouchDatabase } from "./pouchdb/pouch-database";
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";
import { environment } from "../../../environments/environment";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "../session/session-type";
import { MemoryPouchDatabase } from "./pouchdb/memory-pouch-database";
import { RemotePouchDatabase } from "./pouchdb/remote-pouch-database";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";
import { NAVIGATOR_TOKEN } from "../../utils/di-tokens";
import { Entity } from "../entity/model/entity";

/**
 * Provides a method to generate Database instances
 * depending on context and environment configuration.
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseFactoryService {
  private syncState = inject(SyncStateSubject);
  private authService = inject(KeycloakAuthService, { optional: true });
  private navigator = inject<Navigator>(NAVIGATOR_TOKEN, { optional: true });
  private loginStateSubject = inject(LoginStateSubject, { optional: true });
  private readonly ngZone = inject(NgZone);

  createDatabase(dbName: string): Database {
    // only the "primary" (app) database should manage the global login state
    const syncState =
      dbName === Entity.DATABASE ? this.syncState : new SyncStateSubject();

    if (
      environment.session_type === SessionType.synced ||
      environment.session_type === SessionType.synced_idb
    ) {
      const db = new SyncedPouchDatabase(
        dbName,
        this.authService,
        syncState,
        this.navigator,
        this.loginStateSubject,
        this.ngZone,
      );
      if (environment.session_type === SessionType.synced_idb) {
        db.adapter = "idb";
      }
      return db;
    } else if (environment.session_type === SessionType.local) {
      return new PouchDatabase(dbName, syncState, this.ngZone);
    } else {
      return new MemoryPouchDatabase(dbName, syncState, this.ngZone);
    }
  }

  createRemoteDatabase(dbName: string): Database {
    // only the "primary" (app) database should manage the global login state
    const syncState =
      dbName === Entity.DATABASE ? this.syncState : new SyncStateSubject();

    const db = new RemotePouchDatabase(
      dbName,
      this.authService,
      syncState,
      this.ngZone,
    );
    db.init(dbName);
    return db;
  }
}
