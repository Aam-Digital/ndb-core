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
import { NAVIGATOR_TOKEN } from "../../utils/di-tokens";

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

  it("should init the anonymous database with unauthenticatedSession flag", () => {
    // The bootstrap-environment forces session_type = online before Angular
    // DI starts when the URL is a /public-form/ route, so the factory will
    // already produce a RemotePouchDatabase by the time this method runs.
    environment.session_type = SessionType.online;
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
    environment.session_type = SessionType.online;
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

  describe("storage persistence", () => {
    function setupWithNavigator(mockNavigator: Partial<Navigator>) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: DatabaseFactoryService, useValue: factory },
          { provide: IndexeddbMigrationService, useValue: migrationServiceSpy },
          { provide: NAVIGATOR_TOKEN, useValue: mockNavigator },
        ],
      });
      const svc = TestBed.inject(DatabaseResolverService);
      // @ts-ignore - forcing this for stable test conditions
      svc["sessionType"] = SessionType.mock;
      return svc;
    }

    it("should request persistent storage if not already persisted", async () => {
      const persist = vi.fn().mockResolvedValue(true);
      const mockNavigator: Partial<Navigator> = {
        storage: {
          persisted: vi.fn().mockResolvedValue(false),
          persist,
          estimate: vi.fn().mockResolvedValue({ usage: 1, quota: 2 }),
        } as unknown as StorageManager,
      };
      const svc = setupWithNavigator(mockNavigator);

      await svc.initDatabasesForSession({
        name: "test-user",
        id: "test-uuid",
        roles: [],
      } as SessionInfo);

      expect(persist).toHaveBeenCalled();
    });

    it("should not request persistent storage if already persisted", async () => {
      const persist = vi.fn();
      const mockNavigator: Partial<Navigator> = {
        storage: {
          persisted: vi.fn().mockResolvedValue(true),
          persist,
          estimate: vi.fn().mockResolvedValue({ usage: 1, quota: 2 }),
        } as unknown as StorageManager,
      };
      const svc = setupWithNavigator(mockNavigator);

      await svc.initDatabasesForSession({
        name: "test-user",
        id: "test-uuid",
        roles: [],
      } as SessionInfo);

      expect(persist).not.toHaveBeenCalled();
    });
  });
});
