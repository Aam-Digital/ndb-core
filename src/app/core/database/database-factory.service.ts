import { inject, Injectable, Injector, NgZone } from "@angular/core";
import { Database } from "./database";
import { ConflictOutcome, PouchDatabase } from "./pouchdb/pouch-database";
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
import { Logging } from "../logging/logging.service";

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

    return this.withConflictTracking(
      this.instantiateDatabase(dbName, syncState),
    );
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
    return this.withConflictTracking(db);
  }

  /**
   * Let a database count the document update conflicts it resolves
   * (see {@link PouchDatabase.reportConflict}).
   */
  private withConflictTracking(db: PouchDatabase): PouchDatabase {
    db.conflictReporter = (outcome, entityType) => {
      // deliberately not awaited: counting a conflict must neither delay nor
      // fail the save that hit it, so the promise is settled inside
      // trackConflict rather than handed back to the database layer
      void this.trackConflict(outcome, entityType);
    };
    return db;
  }

  private async trackConflict(outcome: ConflictOutcome, entityType: string) {
    try {
      const analytics = await this.getAnalyticsService();
      analytics?.eventTrack(outcome, {
        category: "document_update_conflict",
        label: entityType,
      });
    } catch (err) {
      Logging.debug("could not report document update conflict", err);
    }
  }

  /**
   * Lazily resolves AnalyticsService, so that it is only reached once a conflict
   * actually occurs. Injecting it here would close a circular dependency at
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
