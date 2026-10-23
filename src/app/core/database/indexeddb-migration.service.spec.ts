import type { Mock } from "vitest";
import { TestBed } from "@angular/core/testing";
import { IndexeddbMigrationService } from "./indexeddb-migration.service";
import { SessionInfo } from "../session/auth/session-info";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { NAVIGATOR_TOKEN, WINDOW_TOKEN } from "../../utils/di-tokens";
import { environment } from "../../../environments/environment";
import { SyncStateSubject } from "../session/session-type";
import { SyncState } from "../session/session-states/sync-state.enum";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";
import { AlertService } from "../alerts/alert.service";
import { Logging } from "../logging/logging.service";
import { mockConfirmationDialog } from "../../utils/test-utils/dialog-mocks";

// names derived from the test session (name "testuser", id "abc-123-uuid")
const MIGRATED_FLAG = "DB_MIGRATED_abc-123-uuid";
const LEGACY_APP_DB = "_pouch_testuser-app";
const LEGACY_NOTIFICATIONS_DB = "_pouch_notifications_abc-123-uuid";
const NEW_APP_DB = "_pouch_abc-123-uuid-app";
const LEGACY_DB_NAMES = {
  app: "testuser-app",
  notifications: "notifications_abc-123-uuid",
};
const NEW_DB_NAMES = {
  app: "abc-123-uuid-app",
  notifications: "abc-123-uuid-notifications",
};

describe("IndexeddbMigrationService", () => {
  let service: IndexeddbMigrationService;
  let confirmationDialogSpy: ReturnType<typeof mockConfirmationDialog>;
  let eventTrackSpy: ReturnType<typeof vi.fn>;
  let alertServiceSpy: { addWarning: Mock };
  let mockWindow: {
    location: {
      reload: Mock;
    };
    indexedDB: {
      databases: Mock;
      deleteDatabase: Mock;
    };
  };
  let mockNavigator: {
    onLine: boolean;
  };

  const session: SessionInfo = {
    id: "abc-123-uuid",
    name: "testuser",
    roles: ["user_app"],
  };

  let originalUseIndexeddbAdapter: boolean;

  const createSyncedDbMock = () => {
    const localSyncState = new SyncStateSubject();
    const mockDb = Object.create(
      SyncedPouchDatabase.prototype,
    ) as SyncedPouchDatabase;
    // the separate connection to the server the migration replicates from
    const remoteSource = { close: vi.fn().mockResolvedValue(undefined) };
    mockDb.openRemoteReplicationSource = vi.fn(() => remoteSource as any);
    Object.defineProperty(mockDb, "localSyncState", {
      get: () => localSyncState,
    });

    return { mockDb, localSyncState, remoteSource };
  };

  const mockPouchDbCreation = () => {
    const { mockDb, localSyncState, remoteSource } = createSyncedDbMock();
    const mockNewDb = {
      replicate: {
        from: vi.fn().mockResolvedValue({ ok: true }),
      },
      close: vi.fn().mockResolvedValue(undefined),
    };
    const createPouchDbSpy = vi
      .spyOn(service as any, "createPouchDb")
      .mockReturnValue(mockNewDb as any);

    return {
      mockDb,
      localSyncState,
      remoteSource,
      mockNewDb,
      createPouchDbSpy,
    };
  };

  beforeEach(() => {
    originalUseIndexeddbAdapter = environment.use_indexeddb_adapter;
    confirmationDialogSpy = mockConfirmationDialog(false);
    eventTrackSpy = vi.fn();
    alertServiceSpy = { addWarning: vi.fn() };
    mockWindow = {
      location: { reload: vi.fn() },
      indexedDB: {
        databases: vi.fn().mockResolvedValue([]),
        deleteDatabase: vi.fn(),
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
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: NAVIGATOR_TOKEN, useValue: mockNavigator },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
      ],
    });
    service = TestBed.inject(IndexeddbMigrationService);
    // Avoid importing/providing AnalyticsService directly here to keep this unit test
    // isolated from broader module initialization chains in full-suite runs.
    vi.spyOn<any, any>(service, "getAnalyticsService").mockResolvedValue({
      eventTrack: eventTrackSpy,
    });
    localStorage.removeItem(MIGRATED_FLAG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    environment.use_indexeddb_adapter = originalUseIndexeddbAdapter;
    localStorage.removeItem(MIGRATED_FLAG);
  });

  describe("resolveDbConfig", () => {
    it.each([
      {
        scenario: "flag disabled (deployment opted out)",
        useIndexeddbAdapter: false,
        migrated: false,
        existingDbs: [LEGACY_APP_DB],
        adapter: "idb",
        dbNames: LEGACY_DB_NAMES,
        migrationPending: false,
        trackedEvent: "idb_indexeddb-disabled-config",
        migratedAfter: null,
      },
      {
        // so that enabling the flag again runs the migration with its final sync again,
        // instead of leaving unsynced changes made on the legacy db in the meantime behind
        scenario: "flag disabled after a completed migration (rollback)",
        useIndexeddbAdapter: false,
        migrated: true,
        existingDbs: [LEGACY_APP_DB, NEW_APP_DB],
        adapter: "idb",
        dbNames: LEGACY_DB_NAMES,
        migrationPending: false,
        trackedEvent: "idb_indexeddb-disabled-config",
        migratedAfter: null,
      },
      {
        scenario: "already migrated",
        useIndexeddbAdapter: true,
        migrated: true,
        existingDbs: [LEGACY_APP_DB, NEW_APP_DB],
        adapter: "indexeddb",
        dbNames: NEW_DB_NAMES,
        migrationPending: false,
        trackedEvent: "indexeddb_after-migration",
        migratedAfter: "true",
      },
      {
        scenario: "fresh install (only another user's old DB)",
        useIndexeddbAdapter: true,
        migrated: false,
        existingDbs: [
          "_pouch_otheruser-app",
          "_pouch_notifications_other-user-id",
        ],
        adapter: "indexeddb",
        dbNames: NEW_DB_NAMES,
        migrationPending: false,
        trackedEvent: "indexeddb_fresh-install",
        migratedAfter: "true",
      },
      {
        scenario: "existing user on the old adapter",
        useIndexeddbAdapter: true,
        migrated: false,
        existingDbs: [LEGACY_APP_DB],
        adapter: "idb",
        dbNames: LEGACY_DB_NAMES,
        migrationPending: true,
        trackedEvent: "idb_migration-pending",
        migratedAfter: null,
      },
    ])(
      "resolves the db config and tracks the scenario: $scenario",
      async (c) => {
        environment.use_indexeddb_adapter = c.useIndexeddbAdapter;
        if (c.migrated) {
          localStorage.setItem(MIGRATED_FLAG, "true");
        }
        mockWindow.indexedDB.databases.mockResolvedValue(
          c.existingDbs.map((name) => ({ name, version: 1 })),
        );

        const config = await service.resolveDbConfig(session);

        expect(config).toEqual({ adapter: c.adapter, dbNames: c.dbNames });
        expect(service.migrationPending).toBe(c.migrationPending);
        expect(localStorage.getItem(MIGRATED_FLAG)).toBe(c.migratedAfter);
        expect(eventTrackSpy).toHaveBeenCalledWith(c.trackedEvent, {
          category: "indexeddb_adapter_migration",
        });
      },
    );
  });

  describe("runBackgroundMigration", () => {
    /** let pending promise callbacks (dialog, final sync, analytics) run */
    const flushPromises = () => new Promise((resolve) => setTimeout(resolve));

    it("should skip migration when migrationPending is false", () => {
      service.migrationPending = false;
      const mockDb = {} as any;

      service.runBackgroundMigration(session, mockDb);

      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
    });

    it("should skip migration when offline", () => {
      service.migrationPending = true;
      mockNavigator.onLine = false;
      const { mockDb } = createSyncedDbMock();
      service.runBackgroundMigration(session, mockDb);

      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
      // no connection to the server is opened (and left open)
      expect(mockDb.openRemoteReplicationSource).not.toHaveBeenCalled();
    });

    it("offers to switch only after both the replication into the new db and the sync of the old db completed", async () => {
      service.migrationPending = true;
      const {
        mockDb,
        localSyncState,
        remoteSource,
        mockNewDb,
        createPouchDbSpy,
      } = mockPouchDbCreation();

      service.runBackgroundMigration(session, mockDb);
      await flushPromises();
      expect(createPouchDbSpy).toHaveBeenCalledWith(NEW_DB_NAMES.app);
      // a connection of its own, so that the old db's sync does not purge what it reports as not permitted
      expect(mockNewDb.replicate.from).toHaveBeenCalledWith(remoteSource, {
        batch_size: 500,
      });
      expect(remoteSource.close).toHaveBeenCalled();
      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();

      localSyncState.next(SyncState.COMPLETED);
      await flushPromises();

      expect(confirmationDialogSpy.getConfirmation).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        scenario: "user confirms and final sync succeeds",
        confirmed: true,
        finalSyncFails: false,
        switched: true,
      },
      {
        scenario: "user postpones the reload",
        confirmed: false,
        finalSyncFails: false,
        switched: false,
      },
      {
        scenario: "final sync of the old db fails (e.g. offline)",
        confirmed: true,
        finalSyncFails: true,
        switched: false,
      },
    ])(
      "switches to the new db only once all local changes of the old db are synced: $scenario",
      async ({ confirmed, finalSyncFails, switched }) => {
        service.migrationPending = true;
        confirmationDialogSpy.getConfirmation.mockResolvedValue(confirmed);
        const { mockDb, localSyncState } = mockPouchDbCreation();
        localSyncState.next(SyncState.COMPLETED);
        const progressDialog = { close: vi.fn() };
        confirmationDialogSpy.showProgressDialog.mockReturnValue(
          progressDialog,
        );
        let duringFinalSync: { migratedFlag: string; blocked: boolean };
        const ensureSynced = vi
          .spyOn(mockDb, "ensureSynced")
          .mockImplementation(async () => {
            duringFinalSync = {
              migratedFlag: localStorage.getItem(MIGRATED_FLAG),
              blocked:
                confirmationDialogSpy.showProgressDialog.mock.calls.length ===
                  1 && progressDialog.close.mock.calls.length === 0,
            };
            if (finalSyncFails) {
              throw new Error("offline");
            }
          });

        service.runBackgroundMigration(session, mockDb);
        await flushPromises();

        expect(confirmationDialogSpy.getConfirmation).toHaveBeenCalledTimes(1);
        expect(ensureSynced).toHaveBeenCalledTimes(confirmed ? 1 : 0);
        if (confirmed) {
          // switching only after the push, and the user cannot edit data during it
          expect(duringFinalSync).toEqual({
            migratedFlag: null,
            blocked: true,
          });
          expect(progressDialog.close).toHaveBeenCalled();
        }
        expect(localStorage.getItem(MIGRATED_FLAG)).toBe(
          switched ? "true" : null,
        );
        expect(mockWindow.location.reload).toHaveBeenCalledTimes(
          switched ? 1 : 0,
        );
        expect(alertServiceSpy.addWarning).toHaveBeenCalledTimes(
          finalSyncFails ? 1 : 0,
        );
      },
    );

    it.each([
      {
        scenario: "storage quota exceeded",
        error: new DOMException("quota exceeded", "QuotaExceededError"),
        reported: true,
      },
      {
        scenario: "offline",
        error: new TypeError("Failed to fetch"),
        reported: false,
      },
      {
        scenario: "session expired",
        error: { status: 401, name: "unauthorized" },
        reported: false,
      },
    ])(
      "keeps the old db if the replication into the new db fails: $scenario",
      async ({ error, reported }) => {
        service.migrationPending = true;
        const { mockDb, localSyncState, remoteSource, mockNewDb } =
          mockPouchDbCreation();
        mockNewDb.replicate.from.mockRejectedValue(error);
        const warnSpy = vi
          .spyOn(Logging, "warn")
          .mockImplementation(() => undefined);

        service.runBackgroundMigration(session, mockDb);
        localSyncState.next(SyncState.COMPLETED);
        await flushPromises();

        expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
        expect(localStorage.getItem(MIGRATED_FLAG)).toBeNull();
        expect(remoteSource.close).toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledTimes(reported ? 1 : 0);
        expect(eventTrackSpy).toHaveBeenCalledWith(
          "migration_replication-failed",
          { category: "indexeddb_adapter_migration" },
        );
      },
    );

    it("warns the user about a failed final sync even if usage analytics fails", async () => {
      service.migrationPending = true;
      confirmationDialogSpy.getConfirmation.mockResolvedValue(true);
      const { mockDb, localSyncState } = mockPouchDbCreation();
      localSyncState.next(SyncState.COMPLETED);
      vi.spyOn(mockDb, "ensureSynced").mockRejectedValue(new Error("offline"));
      eventTrackSpy.mockImplementation(() => {
        throw new Error("analytics broken");
      });
      const errorSpy = vi.spyOn(Logging, "error");

      service.runBackgroundMigration(session, mockDb);
      await flushPromises();

      expect(alertServiceSpy.addWarning).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe("cleanupLegacyDatabases", () => {
    it("should skip cleanup when not migrated", async () => {
      localStorage.removeItem(MIGRATED_FLAG);

      await service.cleanupLegacyDatabases(session);

      expect(mockWindow.indexedDB.deleteDatabase).not.toHaveBeenCalled();
    });

    it("should delete legacy databases when migrated", async () => {
      localStorage.setItem(MIGRATED_FLAG, "true");
      mockWindow.indexedDB.deleteDatabase.mockImplementation(() => {
        const req = {
          onsuccess: null as any,
          onerror: null as any,
        } as IDBOpenDBRequest;
        setTimeout(() => req.onsuccess?.(new Event("success")));
        return req;
      });
      mockWindow.indexedDB.databases.mockResolvedValue([
        { name: LEGACY_APP_DB, version: 1 },
        { name: "_pouch_testuser-app_mrview123", version: 1 },
        { name: LEGACY_NOTIFICATIONS_DB, version: 1 },
        { name: NEW_APP_DB, version: 1 },
        { name: "_pouch_abc-123-uuid-notifications", version: 1 },
      ]);

      await service.cleanupLegacyDatabases(session);

      expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith(
        LEGACY_APP_DB,
      );
      expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith(
        "_pouch_testuser-app_mrview123",
      );
      expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith(
        LEGACY_NOTIFICATIONS_DB,
      );
      expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledTimes(3);

      expect(mockWindow.indexedDB.deleteDatabase).not.toHaveBeenCalledWith(
        NEW_APP_DB,
      );
    });

    it("should continue if one database deletion fails", async () => {
      localStorage.setItem(MIGRATED_FLAG, "true");
      mockWindow.indexedDB.databases.mockResolvedValue([
        { name: LEGACY_APP_DB, version: 1 },
        { name: LEGACY_NOTIFICATIONS_DB, version: 1 },
      ]);
      let callCount = 0;
      mockWindow.indexedDB.deleteDatabase.mockImplementation(() => {
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

      await expect(
        service.cleanupLegacyDatabases(session),
      ).resolves.not.toThrow();
      expect(callCount).toBe(2);
    });
  });
});
