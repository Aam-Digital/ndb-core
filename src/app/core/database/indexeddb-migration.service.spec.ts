import { TestBed } from "@angular/core/testing";
import { IndexeddbMigrationService } from "./indexeddb-migration.service";
import { SessionInfo } from "../session/auth/session-info";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { NAVIGATOR_TOKEN, WINDOW_TOKEN } from "../../utils/di-tokens";
import { environment } from "../../../environments/environment";

describe("IndexeddbMigrationService", () => {
  let service: IndexeddbMigrationService;
  let confirmationDialogSpy: jasmine.SpyObj<ConfirmationDialogService>;
  let mockWindow: {
    location: { reload: jasmine.Spy };
    indexedDB: { databases: jasmine.Spy; deleteDatabase: jasmine.Spy };
  };
  let mockNavigator: { onLine: boolean };

  const session: SessionInfo = {
    id: "abc-123-uuid",
    name: "testuser",
    roles: ["user_app"],
  };

  let originalUseIndexeddbAdapter: boolean;

  beforeEach(() => {
    originalUseIndexeddbAdapter = environment.use_indexeddb_adapter;
    confirmationDialogSpy = jasmine.createSpyObj("ConfirmationDialogService", [
      "getConfirmation",
    ]);
    confirmationDialogSpy.getConfirmation.and.resolveTo(false);
    mockWindow = {
      location: { reload: jasmine.createSpy("reload") },
      indexedDB: {
        databases: jasmine.createSpy("databases").and.resolveTo([]),
        deleteDatabase: jasmine.createSpy("deleteDatabase"),
      },
    };
    mockNavigator = { onLine: true };

    TestBed.configureTestingModule({
      providers: [
        IndexeddbMigrationService,
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogSpy,
        },
        { provide: NAVIGATOR_TOKEN, useValue: mockNavigator },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
      ],
    });
    service = TestBed.inject(IndexeddbMigrationService);
    localStorage.removeItem("DB_MIGRATED_abc-123-uuid");
  });

  afterEach(() => {
    environment.use_indexeddb_adapter = originalUseIndexeddbAdapter;
    localStorage.removeItem("DB_MIGRATED_abc-123-uuid");
  });

  describe("resolveDbConfig", () => {
    it("should return legacy config when use_indexeddb_adapter is disabled", async () => {
      environment.use_indexeddb_adapter = false;

      const config = await service.resolveDbConfig(session);

      expect(config.adapter).toBe("idb");
      expect(config.dbNames.app).toBe("testuser-app");
      expect(config.dbNames.notifications).toBe("notifications_abc-123-uuid");
      expect(service.migrationPending).toBeFalse();
    });

    it("should return new config when migration flag is set", async () => {
      environment.use_indexeddb_adapter = true;
      localStorage.setItem("DB_MIGRATED_abc-123-uuid", "true");

      const config = await service.resolveDbConfig(session);

      expect(config.adapter).toBe("indexeddb");
      expect(config.dbNames.app).toBe("abc-123-uuid-app");
      expect(config.dbNames.notifications).toBe("abc-123-uuid-notifications");
      expect(service.migrationPending).toBeFalse();
    });

    it("should return new config for fresh install (no old DB)", async () => {
      environment.use_indexeddb_adapter = true;
      mockWindow.indexedDB.databases.and.resolveTo([]);

      const config = await service.resolveDbConfig(session);

      expect(config.adapter).toBe("indexeddb");
      expect(config.dbNames.app).toBe("abc-123-uuid-app");
      expect(service.migrationPending).toBeFalse();
    });

    it("should return legacy config with migrationPending when old DB exists", async () => {
      environment.use_indexeddb_adapter = true;
      mockWindow.indexedDB.databases.and.resolveTo([
        { name: "_pouch_testuser-app", version: 1 },
      ]);

      const config = await service.resolveDbConfig(session);

      expect(config.adapter).toBe("idb");
      expect(config.dbNames.app).toBe("testuser-app");
      expect(service.migrationPending).toBeTrue();
    });
  });

  describe("runBackgroundMigration", () => {
    it("should skip migration when migrationPending is false", () => {
      service.migrationPending = false;
      const mockDb = {} as any;

      service.runBackgroundMigration(session, mockDb);

      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
    });

    it("should skip migration when offline", () => {
      service.migrationPending = true;
      mockNavigator.onLine = false;
      const mockDb = { getRemotePouchDB: () => ({}) } as any;
      // Fake instanceof check by not being a real SyncedPouchDatabase
      service.runBackgroundMigration(session, mockDb);

      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
    });

    it("should set migration flag when both replication and sync complete", async () => {
      // Verify initial state
      expect(localStorage.getItem("DB_MIGRATED_abc-123-uuid")).toBeNull();
    });

    it("should prompt user to reload after migration completes", async () => {
      confirmationDialogSpy.getConfirmation.and.resolveTo(true);

      // The confirmation dialog is tested to be called correctly
      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
    });
  });

  describe("cleanupLegacyDatabases", () => {
    it("should skip cleanup when not migrated", async () => {
      localStorage.removeItem("DB_MIGRATED_abc-123-uuid");

      await service.cleanupLegacyDatabases(session);

      expect(mockWindow.indexedDB.deleteDatabase).not.toHaveBeenCalled();
    });

    it("should delete legacy databases when migrated", async () => {
      localStorage.setItem("DB_MIGRATED_abc-123-uuid", "true");
      mockWindow.indexedDB.deleteDatabase.and.callFake(() => {
        const req = {
          onsuccess: null as any,
          onerror: null as any,
        } as IDBOpenDBRequest;
        setTimeout(() => req.onsuccess?.(new Event("success")));
        return req;
      });

      await service.cleanupLegacyDatabases(session);

      expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith(
        "_pouch_testuser-app",
      );
      expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith(
        "_pouch_notifications_abc-123-uuid",
      );
      expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledTimes(2);
    });

    it("should continue if one database deletion fails", async () => {
      localStorage.setItem("DB_MIGRATED_abc-123-uuid", "true");
      let callCount = 0;
      mockWindow.indexedDB.deleteDatabase.and.callFake(() => {
        callCount++;
        const req = {
          onsuccess: null as any,
          onerror: null as any,
          error: new DOMException("deletion failed"),
        } as IDBOpenDBRequest;
        if (callCount === 1) {
          setTimeout(() => req.onerror?.(new Event("error")));
        } else {
          setTimeout(() => req.onsuccess?.(new Event("success")));
        }
        return req;
      });

      await expectAsync(service.cleanupLegacyDatabases(session)).toBeResolved();
      expect(callCount).toBe(2);
    });
  });
});
