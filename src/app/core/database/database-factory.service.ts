import { Inject, Injectable, Optional } from "@angular/core";
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

/**
 * Provides a method to generate Database instances
 * depending on context and environment configuration.
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseFactoryService {
  constructor(
    @Optional() private authService: KeycloakAuthService,
    private syncState: SyncStateSubject,
    @Inject(NAVIGATOR_TOKEN) private navigator: Navigator,
    private loginStateSubject: LoginStateSubject,
  ) {}

  createDatabase(dbName: string): Database {
    if (environment.session_type === SessionType.synced) {
      return new SyncedPouchDatabase(
        dbName,
        this.authService,
        this.syncState,
        this.navigator,
        this.loginStateSubject,
      );
    } else if (environment.session_type === SessionType.local) {
      return new PouchDatabase(dbName);
    } else {
      return new MemoryPouchDatabase(dbName);
    }
  }

  createRemoteDatabase(dbName: string): Database {
    const db = new RemotePouchDatabase(dbName, this.authService);
    db.init(dbName);
    return db;
  }
}
