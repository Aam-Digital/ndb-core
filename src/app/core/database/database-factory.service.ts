import { inject, Injectable, Injector, NgZone } from "@angular/core";
import { Database } from "./database";
import { PouchDatabase } from "./pouchdb/pouch-database";
import type { AnalyticsService } from "../analytics/analytics.service";
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
import { AlertService } from "../alerts/alert.service";
import { PouchdbCorruptionRecoveryService } from "./pouchdb/pouchdb-corruption-recovery.service";

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
  private readonly alertService = inject(AlertService);
  private readonly injector = inject(Injector);

  private analyticsServicePromise?: Promise<AnalyticsService | null>;

  createDatabase(dbName: string): Database {
    // only the "primary" (app) database should manage the global login state
    const syncState =
      dbName === Entity.DATABASE ? this.syncState : new SyncStateSubject();

    return this.withAnalytics(this.instantiateDatabase(dbName, syncState));
  }

  private instantiateDatabase(
    dbName: string,
    syncState: SyncStateSubject,
  ): PouchDatabase {
    if (environment.session_type === SessionType.synced) {
      return new SyncedPouchDatabase(
        dbName,
        this.authService,
        syncState,
        this.navigator,
        this.loginStateSubject,
        this.ngZone,
        this.alertService,
        // Lazily resolved via Injector to avoid a circular dependency between
        // DatabaseFactoryService and PouchdbCorruptionRecoveryService.
        this.injector.get(PouchdbCorruptionRecoveryService, null) ?? undefined,
      );
    } else if (environment.session_type === SessionType.online) {
      return new RemotePouchDatabase(
        dbName,
        this.authService,
        syncState,
        this.ngZone,
        this.alertService,
      );
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
      this.alertService,
    );
    db.init(dbName);
    return this.withAnalytics(db);
  }

  /**
   * Give a database access to usage analytics, which it cannot inject itself
   * (see {@link PouchDatabase.analytics}).
   */
  private withAnalytics(db: PouchDatabase): PouchDatabase {
    db.analytics = () => this.getAnalyticsService();
    return db;
  }

  /**
   * Lazily resolves AnalyticsService, so that it is only reached once something
   * is actually tracked. Injecting it here would close a circular dependency at
   * bootstrap: AnalyticsService -> ConfigService -> EntityMapperService ->
   * DatabaseResolver -> DatabaseFactoryService.
   * (IndexeddbMigrationService uses the same pattern for the same reason.)
   */
  private getAnalyticsService(): Promise<AnalyticsService | null> {
    if (this.analyticsServicePromise === undefined) {
      this.analyticsServicePromise = import("../analytics/analytics.service")
        .then(({ AnalyticsService }) =>
          this.injector.get<AnalyticsService | null>(AnalyticsService, null),
        )
        .catch(() => null);
    }

    return this.analyticsServicePromise;
  }
}
