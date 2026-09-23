import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "../session/session-type";
import { MemoryPouchDatabase } from "./pouchdb/memory-pouch-database";
import { PouchDatabase } from "./pouchdb/pouch-database";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";
import { DatabaseFactoryService } from "./database-factory.service";
import { Database } from "./database";
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";
import { NAVIGATOR_TOKEN } from "app/utils/di-tokens";
import { RemotePouchDatabase } from "./pouchdb/remote-pouch-database";
import { AlertService } from "../alerts/alert.service";
import { PouchdbCorruptionRecoveryService } from "./pouchdb/pouchdb-corruption-recovery.service";

describe("DatabaseFactoryService", () => {
  let service: DatabaseFactoryService;
  const mockAlertService = { addWarning: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DatabaseFactoryService,
        { provide: KeycloakAuthService, useValue: {} },
        { provide: NAVIGATOR_TOKEN, useValue: {} },
        { provide: AlertService, useValue: mockAlertService },
        {
          provide: PouchdbCorruptionRecoveryService,
          useValue: { handleKnownMultiTabCorruption: vi.fn() },
        },
        SyncStateSubject,
        LoginStateSubject,
      ],
    });
    service = TestBed.inject(DatabaseFactoryService);
  });

  it("should create the database according to the session type in the environment", async () => {
    async function testDatabaseCreation(
      sessionType: SessionType,
      expectedDB: abstract new (...args: any[]) => Database,
    ) {
      environment.session_type = sessionType;
      const db = service.createDatabase("test-db");
      expect(db).toBeInstanceOf(expectedDB);
    }

    await testDatabaseCreation(SessionType.mock, MemoryPouchDatabase);
    await testDatabaseCreation(SessionType.local, PouchDatabase);
    await testDatabaseCreation(SessionType.synced, SyncedPouchDatabase);
    await testDatabaseCreation(SessionType.online, RemotePouchDatabase);
  });

  it("should default to indexeddb adapter for synced session type", () => {
    environment.session_type = SessionType.synced;
    const db = service.createDatabase("test-db") as SyncedPouchDatabase;
    expect(db.adapter).toBe("indexeddb");
  });

  describe("analytics access", () => {
    // what a database reports through it is covered by the pouch-database spec;
    // here only the wiring matters, as a database cannot inject the service
    it("should give a database from either entry point an analytics accessor", async () => {
      const analytics = { eventTrack: vi.fn() };
      // stubbed rather than provided: AnalyticsService is resolved lazily to
      // break a DI cycle, and importing it here would defeat that
      vi.spyOn<any, any>(service, "getAnalyticsService").mockResolvedValue(
        analytics,
      );
      environment.session_type = SessionType.mock;

      // easy to wire on one entry point and forget on the other
      for (const db of [
        service.createDatabase("test-db") as PouchDatabase,
        service.createRemoteDatabase("test-remote-db") as PouchDatabase,
      ]) {
        await expect(db.analytics()).resolves.toBe(analytics);
      }
    });
  });

  it("should resolve analytics lazily to null when it is not available, and only once", async () => {
    // the lazy resolution is what keeps the AnalyticsService -> ConfigService ->
    // EntityMapperService -> DatabaseResolver -> DatabaseFactoryService cycle
    // from being closed during bootstrap
    const first = (service as any).getAnalyticsService();
    const second = (service as any).getAnalyticsService();

    expect(second).toBe(first);
    await expect(first).resolves.toBeNull();
  });
});
