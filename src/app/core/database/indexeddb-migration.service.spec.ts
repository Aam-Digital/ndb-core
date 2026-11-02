import type { Mock } from "vitest";
import { TestBed } from "@angular/core/testing";
import {
  DbConfig,
  IndexeddbMigrationService,
} from "./indexeddb-migration.service";
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
import { MultiTabDetectionService } from "./multi-tab-detection.service";

// names derived from the test session (name "testuser", id "abc-123-uuid")
const MIGRATED_FLAG = "DB_MIGRATED_abc-123-uuid";
const LEGACY_APP_DB = "_pouch_testuser-app";
const NEW_APP_DB = "_pouch_abc-123-uuid-app";
const LEGACY_DB_NAMES = {
  app: "testuser-app",
  notifications: "notifications_abc-123-uuid",
};
/** the config of a session on the legacy db, with the migration pending */
const PENDING_CONFIG: DbConfig = {
  adapter: "idb",
  dbNames: LEGACY_DB_NAMES,
  migrationPending: true,
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
    };
  };
  let mockNavigator: {
    onLine: boolean;
  };
  let multiTabDetection: { isMultipleTabsOpen: boolean };

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
      },
    };
    mockNavigator = { onLine: true };
    multiTabDetection = { isMultipleTabsOpen: false };

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
        { provide: MultiTabDetectionService, useValue: multiTabDetection },
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

  /** let pending promise callbacks (dialog, final sync, analytics) run */
  const flushPromises = () => new Promise((resolve) => setTimeout(resolve));

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

        expect(config).toEqual({
          adapter: c.adapter,
          dbNames: c.dbNames,
          migrationPending: c.migrationPending,
        });
        expect(localStorage.getItem(MIGRATED_FLAG)).toBe(c.migratedAfter);
        expect(eventTrackSpy).toHaveBeenCalledWith(c.trackedEvent, {
          category: "indexeddb_adapter_migration",
        });
      },
    );
  });

  describe("startMigrationIfPending", () => {
    it("should skip migration when it is not pending", () => {
      const { mockDb } = createSyncedDbMock();

      service.startMigrationIfPending(session, mockDb, {
        ...PENDING_CONFIG,
        migrationPending: false,
      });

      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
    });

    it("should skip migration when offline", () => {
      mockNavigator.onLine = false;
      const { mockDb } = createSyncedDbMock();
      service.startMigrationIfPending(session, mockDb, PENDING_CONFIG);

      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
      // no connection to the server is opened (and left open)
      expect(mockDb.openRemoteReplicationSource).not.toHaveBeenCalled();
    });

    it("offers to switch only after both the replication into the new db and the sync of the old db completed", async () => {
      const {
        mockDb,
        localSyncState,
        remoteSource,
        mockNewDb,
        createPouchDbSpy,
      } = mockPouchDbCreation();

      service.startMigrationIfPending(session, mockDb, PENDING_CONFIG);
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

        service.startMigrationIfPending(session, mockDb, PENDING_CONFIG);
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
        const { mockDb, localSyncState, remoteSource, mockNewDb } =
          mockPouchDbCreation();
        mockNewDb.replicate.from.mockRejectedValue(error);
        const warnSpy = vi
          .spyOn(Logging, "warn")
          .mockImplementation(() => undefined);

        service.startMigrationIfPending(session, mockDb, PENDING_CONFIG);
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
      confirmationDialogSpy.getConfirmation.mockResolvedValue(true);
      const { mockDb, localSyncState } = mockPouchDbCreation();
      localSyncState.next(SyncState.COMPLETED);
      vi.spyOn(mockDb, "ensureSynced").mockRejectedValue(new Error("offline"));
      eventTrackSpy.mockImplementation(() => {
        throw new Error("analytics broken");
      });
      const errorSpy = vi.spyOn(Logging, "error");

      service.startMigrationIfPending(session, mockDb, PENDING_CONFIG);
      await flushPromises();

      expect(alertServiceSpy.addWarning).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe("legacy db with the name of the new db (token without username)", () => {
    // the session name falls back to the id
    const collidingSession: SessionInfo = { ...session, name: session.id };
    const COLLIDING_LEGACY_DB_NAMES = {
      app: NEW_DB_NAMES.app,
      notifications: LEGACY_DB_NAMES.notifications,
    };

    /** start the app on the legacy "idb" db, which has the name of the new db */
    const startOnLegacyDb = async () => {
      mockWindow.indexedDB.databases.mockResolvedValue([
        { name: NEW_APP_DB, version: 5 },
      ]);
      confirmationDialogSpy.getConfirmation.mockResolvedValue(true);
      const mocks = mockPouchDbCreation();
      const calls: string[] = [];
      const ensureSynced = vi
        .spyOn(mocks.mockDb, "ensureSynced")
        .mockImplementation(async () => {
          calls.push("final sync");
        });
      const destroy = vi
        .spyOn(mocks.mockDb, "destroy")
        .mockImplementation(async () => {
          calls.push("delete");
        });

      const config = await service.resolveDbConfig(collidingSession);
      service.startMigrationIfPending(collidingSession, mocks.mockDb, config);
      return { ...mocks, config, calls, ensureSynced, destroy };
    };

    it("never opens the db in use with the other adapter, but deletes it right after a final sync", async () => {
      const { config, localSyncState, createPouchDbSpy, calls } =
        await startOnLegacyDb();
      await flushPromises();
      // offered only after a completed sync of the old db
      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();

      localSyncState.next(SyncState.COMPLETED);
      await flushPromises();

      expect(config).toEqual({
        adapter: "idb",
        dbNames: COLLIDING_LEGACY_DB_NAMES,
        migrationPending: true,
      });
      expect(createPouchDbSpy).not.toHaveBeenCalled();
      expect(calls).toEqual(["final sync", "delete"]);
      expect(localStorage.getItem(MIGRATED_FLAG)).toBe("true");
      expect(mockWindow.location.reload).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        scenario: "app open in another tab",
        otherTabBefore: true,
        otherTabDuringSync: false,
        deletionFails: false,
        offered: false,
        deleted: false,
        reloaded: false,
      },
      {
        scenario: "another tab opened during the final sync",
        otherTabBefore: false,
        otherTabDuringSync: true,
        deletionFails: false,
        offered: true,
        deleted: false,
        reloaded: false,
      },
      {
        // the old db cannot be used anymore after a started deletion: reopened
        scenario: "deletion fails",
        otherTabBefore: false,
        otherTabDuringSync: false,
        deletionFails: true,
        offered: true,
        deleted: true,
        reloaded: true,
      },
    ])(
      "keeps using the old db if it cannot be deleted without losing changes: $scenario",
      async (c) => {
        multiTabDetection.isMultipleTabsOpen = c.otherTabBefore;
        const { localSyncState, ensureSynced, destroy } =
          await startOnLegacyDb();
        ensureSynced.mockImplementation(async () => {
          multiTabDetection.isMultipleTabsOpen ||= c.otherTabDuringSync;
        });
        if (c.deletionFails) {
          destroy.mockRejectedValue(new DOMException("deletion failed"));
        }

        localSyncState.next(SyncState.COMPLETED);
        await flushPromises();

        expect(confirmationDialogSpy.getConfirmation).toHaveBeenCalledTimes(
          c.offered ? 1 : 0,
        );
        expect(destroy).toHaveBeenCalledTimes(c.deleted ? 1 : 0);
        expect(localStorage.getItem(MIGRATED_FLAG)).toBeNull();
        expect(mockWindow.location.reload).toHaveBeenCalledTimes(
          c.reloaded ? 1 : 0,
        );
      },
    );

    it("uses the db as the new db once it was created by the indexeddb adapter, even without the migration flag", async () => {
      mockWindow.indexedDB.databases.mockResolvedValue([
        { name: NEW_APP_DB, version: 10 ** 13 + Date.now() },
      ]);

      const config = await service.resolveDbConfig(collidingSession);

      expect(config).toEqual({
        adapter: "indexeddb",
        dbNames: NEW_DB_NAMES,
        migrationPending: false,
      });
      expect(localStorage.getItem(MIGRATED_FLAG)).toBe("true");
    });
  });
});
