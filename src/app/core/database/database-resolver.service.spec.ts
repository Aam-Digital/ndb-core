import { TestBed } from "@angular/core/testing";

import { DatabaseResolverService } from "./database-resolver.service";
import { SessionInfo } from "../session/auth/session-info";
import { MemoryPouchDatabase } from "./pouchdb/memory-pouch-database";
import { DatabaseFactoryService } from "./database-factory.service";
import { SyncStateSubject } from "../session/session-type";
import {
  IndexeddbMigrationService,
  DbConfig,
} from "./indexeddb-migration.service";

describe("DatabaseResolverService", () => {
  let service: DatabaseResolverService;
  let syncStateSubject: SyncStateSubject;
  let migrationServiceSpy: jasmine.SpyObj<IndexeddbMigrationService>;

  const testDbConfig: DbConfig = {
    dbNames: { app: "test-uuid-app", notifications: "test-uuid-notifications" },
    adapter: "indexeddb",
  };

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    migrationServiceSpy = jasmine.createSpyObj("IndexeddbMigrationService", [
      "resolveDbConfig",
      "runBackgroundMigration",
    ]);
    migrationServiceSpy.resolveDbConfig.and.resolveTo(testDbConfig);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DatabaseFactoryService,
          useValue: {
            createDatabase: () =>
              new MemoryPouchDatabase("unit-test-db", syncStateSubject),
          },
        },
        {
          provide: IndexeddbMigrationService,
          useValue: migrationServiceSpy,
        },
      ],
    });
    service = TestBed.inject(DatabaseResolverService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should init database with resolved DB name from migration service", async () => {
    const defaultDb = service.getDatabase();
    spyOn(defaultDb, "init");

    await service.initDatabasesForSession({
      name: "test-user",
      id: "test-uuid",
      roles: [],
    } as SessionInfo);

    expect(migrationServiceSpy.resolveDbConfig).toHaveBeenCalled();
    expect(defaultDb.init).toHaveBeenCalledWith("test-uuid-app");
  });

  it("should use legacy DB names when migration returns legacy config", async () => {
    migrationServiceSpy.resolveDbConfig.and.resolveTo({
      dbNames: {
        app: "test-user-app",
        notifications: "notifications_test-uuid",
      },
      adapter: "idb",
    });

    const defaultDb = service.getDatabase();
    spyOn(defaultDb, "init");

    await service.initDatabasesForSession({
      name: "test-user",
      id: "test-uuid",
      roles: [],
    } as SessionInfo);

    expect(defaultDb.init).toHaveBeenCalledWith("test-user-app");
  });
});
