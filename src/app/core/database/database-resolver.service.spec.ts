import { TestBed } from "@angular/core/testing";

import { DatabaseResolverService } from "./database-resolver.service";
import { SessionInfo } from "../session/auth/session-info";
import { MemoryPouchDatabase } from "./pouchdb/memory-pouch-database";
import { RemotePouchDatabase } from "./pouchdb/remote-pouch-database";
import { DatabaseFactoryService } from "./database-factory.service";
import { SessionType, SyncStateSubject } from "../session/session-type";
import {
  IndexeddbMigrationService,
  DbConfig,
} from "./indexeddb-migration.service";
import { environment } from "../../../environments/environment";

describe("DatabaseResolverService", () => {
  let service: DatabaseResolverService;
  let syncStateSubject: SyncStateSubject;
  let migrationServiceSpy: any;
  let factory: { createDatabase: (dbName: string) => any };
  const originalSessionType = environment.session_type;

  const testDbConfig: DbConfig = {
    dbNames: { app: "test-uuid-app", notifications: "test-uuid-notifications" },
    adapter: "indexeddb",
  };

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    migrationServiceSpy = {
      resolveDbConfig: vi
        .fn()
        .mockName("IndexeddbMigrationService.resolveDbConfig"),
      runBackgroundMigration: vi
        .fn()
        .mockName("IndexeddbMigrationService.runBackgroundMigration"),
    };
    migrationServiceSpy.resolveDbConfig.mockResolvedValue(testDbConfig);

    factory = {
      createDatabase: (dbName: string) => {
        if (environment.session_type === SessionType.online) {
          return new RemotePouchDatabase(dbName, null as any, syncStateSubject);
        }
        return new MemoryPouchDatabase(dbName, syncStateSubject);
      },
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DatabaseFactoryService,
          useValue: factory,
        },
        {
          provide: IndexeddbMigrationService,
          useValue: migrationServiceSpy,
        },
      ],
    });
    service = TestBed.inject(DatabaseResolverService);

    // @ts-ignore - forcing this for stable test conditions
    service["sessionType"] = SessionType.mock;
  });

  afterEach(() => {
    environment.session_type = originalSessionType;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should init database with resolved DB name from migration service", async () => {
    const defaultDb = service.getDatabase();
    vi.spyOn(defaultDb, "init");

    await service.initDatabasesForSession({
      name: "test-user",
      id: "test-uuid",
      roles: [],
    } as SessionInfo);

    expect(migrationServiceSpy.resolveDbConfig).toHaveBeenCalled();
    expect(defaultDb.init).toHaveBeenCalledWith("test-uuid-app");
  });

  it("should switch to online session type before creating the anonymous database", () => {
    environment.session_type = SessionType.synced;
    // @ts-ignore
    service["sessionType"] = SessionType.synced;
    let sessionTypeAtCreate: SessionType | undefined;
    vi.spyOn(factory, "createDatabase").mockImplementation((dbName: string) => {
      sessionTypeAtCreate = environment.session_type;
      return new RemotePouchDatabase(dbName, null as any, syncStateSubject);
    });

    service.initDatabasesForAnonymous();

    expect(sessionTypeAtCreate).toBe(SessionType.online);
    expect(environment.session_type).toBe(SessionType.online);
  });

  it("should init the anonymous database with unauthenticatedSession flag", () => {
    environment.session_type = SessionType.synced;
    // @ts-ignore
    service["sessionType"] = SessionType.synced;
    const initSpy = vi.fn();
    vi.spyOn(factory, "createDatabase").mockImplementation((dbName: string) => {
      const db = new RemotePouchDatabase(dbName, null as any, syncStateSubject);
      db.init = initSpy;
      vi.spyOn(db, "isInitialized").mockReturnValue(false);
      return db;
    });

    service.initDatabasesForAnonymous();

    expect(initSpy).toHaveBeenCalledWith(undefined, {
      unauthenticatedSession: true,
    });
  });

  it("should not re-init the anonymous database if already initialized", () => {
    environment.session_type = SessionType.synced;
    // @ts-ignore
    service["sessionType"] = SessionType.synced;
    const initSpy = vi.fn();
    vi.spyOn(factory, "createDatabase").mockImplementation((dbName: string) => {
      const db = new RemotePouchDatabase(dbName, null as any, syncStateSubject);
      db.init = initSpy;
      vi.spyOn(db, "isInitialized").mockReturnValue(true);
      return db;
    });

    service.initDatabasesForAnonymous();

    expect(initSpy).not.toHaveBeenCalled();
  });

  it("should use legacy DB names when migration returns legacy config", async () => {
    migrationServiceSpy.resolveDbConfig.mockResolvedValue({
      dbNames: {
        app: "test-user-app",
        notifications: "notifications_test-uuid",
      },
      adapter: "idb",
    });

    const defaultDb = service.getDatabase();
    vi.spyOn(defaultDb, "init");

    await service.initDatabasesForSession({
      name: "test-user",
      id: "test-uuid",
      roles: [],
    } as SessionInfo);

    expect(defaultDb.init).toHaveBeenCalledWith("test-user-app");
  });
});
