import { Injectable, inject } from "@angular/core";
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
  private authService = inject(KeycloakAuthService);
  private syncState = inject(SyncStateSubject);
  private navigator = inject<Navigator>(NAVIGATOR_TOKEN);
  private loginStateSubject = inject(LoginStateSubject);


  createDatabase(dbName: string): Database {
    // only the "primary" (app) database should manage the global login state
    const syncState =
      dbName === Entity.DATABASE ? this.syncState : new SyncStateSubject();

    if (environment.session_type === SessionType.synced) {
      return new SyncedPouchDatabase(
        dbName,
        this.authService,
        syncState,
        this.navigator,
        this.loginStateSubject,
      );
    } else if (environment.session_type === SessionType.local) {
      return new PouchDatabase(dbName, syncState);
    } else {
      return new MemoryPouchDatabase(dbName, syncState);
    }
  }

  createRemoteDatabase(dbName: string): Database {
    // only the "primary" (app) database should manage the global login state
    const syncState =
      dbName === Entity.DATABASE ? this.syncState : new SyncStateSubject();

    const db = new RemotePouchDatabase(dbName, this.authService, syncState);
    db.init(dbName);
    return db;
  }
}
