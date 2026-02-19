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
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";
import { NAVIGATOR_TOKEN } from "app/utils/di-tokens";

describe("DatabaseFactoryService", () => {
  let service: DatabaseFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DatabaseFactoryService,
        { provide: KeycloakAuthService, useValue: {} },
        { provide: NAVIGATOR_TOKEN, useValue: {} },
        SyncStateSubject,
        LoginStateSubject,
      ],
    });
    service = TestBed.inject(DatabaseFactoryService);
  });

  it("should create the database according to the session type in the environment", async () => {
    async function testDatabaseCreation(
      sessionType: SessionType,
      expectedDB: typeof PouchDatabase | typeof SyncedPouchDatabase,
    ) {
      environment.session_type = sessionType;
      const db = service.createDatabase("test-db");
      expect(db).toBeInstanceOf(expectedDB);
    }

    await testDatabaseCreation(SessionType.mock, MemoryPouchDatabase);
    await testDatabaseCreation(SessionType.local, PouchDatabase);
    await testDatabaseCreation(SessionType.synced, SyncedPouchDatabase);
    await testDatabaseCreation(SessionType.synced_idb, SyncedPouchDatabase);
  });

  it("should set idb adapter for synced_idb session type", () => {
    const prev = environment.session_type;

    environment.session_type = SessionType.synced_idb;
    const db = service.createDatabase("test-db") as SyncedPouchDatabase;
    expect(db.adapter).toBe("idb");

    environment.session_type = prev;
  });

  it("should use indexeddb adapter for synced session type", () => {
    const prev = environment.session_type;

    environment.session_type = SessionType.synced;
    const db = service.createDatabase("test-db") as SyncedPouchDatabase;
    expect(db.adapter).toBe("indexeddb");

    environment.session_type = prev;
  });
});
