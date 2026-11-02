import type { Mock } from "vitest";
import { TestBed } from "@angular/core/testing";
import {
  DbConfig,
  IndexeddbMigrationService,
} from "./indexeddb-migration.service";
import { SessionInfo } from "../session/auth/session-info";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
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
  let multiTabDetection: { isMultipleTabsOpen: boolean };

  const session: SessionInfo = {
    id: "abc-123-uuid",
    name: "testuser",
    roles: ["user_app"],
  };

  let originalUseIndexeddbAdapter: boolean;

  /** the legacy db the app runs on, recording the final sync and its deletion */
  const createLegacyDbMock = () => {
    const localSyncState = new SyncStateSubject();
    const legacyDb = Object.create(
      SyncedPouchDatabase.prototype,
    ) as SyncedPouchDatabase;
    Object.defineProperty(legacyDb, "localSyncState", {
      get: () => localSyncState,
    });
    const calls: string[] = [];
    const ensureSynced = vi
      .spyOn(legacyDb, "ensureSynced")
      .mockImplementation(async () => {
        calls.push("final sync");
      });
    const destroy = vi
      .spyOn(legacyDb, "destroy")
      .mockImplementation(async () => {
        calls.push("delete");
      });
    return { legacyDb, localSyncState, calls, ensureSynced, destroy };
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
    multiTabDetection = { isMultipleTabsOpen: false };

    TestBed.configureTestingModule({
      providers: [
        IndexeddbMigrationService,
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogSpy,
        },
        { provide: AlertService, useValue: alertServiceSpy },
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

  it("treats a db of the indexeddb adapter with the legacy name as the new db, even without the migration flag", async () => {
    // without a "username" claim in the token, the session name falls back to the id
    const sessionWithoutUsername: SessionInfo = {
      ...session,
      name: session.id,
    };
    mockWindow.indexedDB.databases.mockResolvedValue([
      { name: NEW_APP_DB, version: 10 ** 13 + Date.now() },
    ]);

    const config = await service.resolveDbConfig(sessionWithoutUsername);

    expect(config).toEqual({
      adapter: "indexeddb",
      dbNames: NEW_DB_NAMES,
      migrationPending: false,
    });
    expect(localStorage.getItem(MIGRATED_FLAG)).toBe("true");
  });

  describe("startMigrationIfPending", () => {
    it("should skip migration when it is not pending", async () => {
      const { legacyDb, localSyncState } = createLegacyDbMock();

      service.startMigrationIfPending(session, legacyDb, {
        ...PENDING_CONFIG,
        migrationPending: false,
      });
      localSyncState.next(SyncState.COMPLETED);
      await flushPromises();

      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();
    });

    it("switches to the new db only after a final sync of the legacy db, which is then deleted", async () => {
      confirmationDialogSpy.getConfirmation.mockResolvedValue(true);
      const progressDialog = { close: vi.fn() };
      confirmationDialogSpy.showProgressDialog.mockReturnValue(progressDialog);
      const { legacyDb, localSyncState, calls, ensureSynced } =
        createLegacyDbMock();
      let blockedDuringFinalSync: boolean;
      ensureSynced.mockImplementation(async () => {
        calls.push("final sync");
        blockedDuringFinalSync = progressDialog.close.mock.calls.length === 0;
      });

      service.startMigrationIfPending(session, legacyDb, PENDING_CONFIG);
      await flushPromises();
      // offered only after a completed sync of the legacy db
      expect(confirmationDialogSpy.getConfirmation).not.toHaveBeenCalled();

      localSyncState.next(SyncState.COMPLETED);
      await flushPromises();

      expect(confirmationDialogSpy.getConfirmation).toHaveBeenCalledTimes(1);
      expect(calls).toEqual(["final sync", "delete"]);
      // the user cannot change data on the legacy db during the final sync
      expect(blockedDuringFinalSync).toBe(true);
      expect(progressDialog.close).toHaveBeenCalled();
      expect(localStorage.getItem(MIGRATED_FLAG)).toBe("true");
      expect(mockWindow.location.reload).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        scenario: "user postpones the switch",
        confirmed: false,
        otherTabBefore: false,
        otherTabDuringSync: false,
        finalSyncFails: false,
        deletionFails: false,
        expectedCalls: [],
        warned: false,
        reloaded: false,
      },
      {
        scenario: "app open in another tab",
        confirmed: true,
        otherTabBefore: true,
        otherTabDuringSync: false,
        finalSyncFails: false,
        deletionFails: false,
        expectedCalls: [],
        warned: false,
        reloaded: false,
      },
      {
        scenario: "final sync fails (e.g. offline)",
        confirmed: true,
        otherTabBefore: false,
        otherTabDuringSync: false,
        finalSyncFails: true,
        deletionFails: false,
        expectedCalls: ["final sync"],
        warned: true,
        reloaded: false,
      },
      {
        scenario: "another tab opened during the final sync",
        confirmed: true,
        otherTabBefore: false,
        otherTabDuringSync: true,
        finalSyncFails: false,
        deletionFails: false,
        expectedCalls: ["final sync"],
        warned: false,
        reloaded: false,
      },
      {
        // the legacy db cannot be used anymore after a started deletion: reopened
        scenario: "deletion fails",
        confirmed: true,
        otherTabBefore: false,
        otherTabDuringSync: false,
        finalSyncFails: false,
        deletionFails: true,
        expectedCalls: ["final sync", "delete"],
        warned: false,
        reloaded: true,
      },
    ])(
      "keeps using the legacy db unless all its changes are synced and it can be deleted: $scenario",
      async (c) => {
        confirmationDialogSpy.getConfirmation.mockResolvedValue(c.confirmed);
        multiTabDetection.isMultipleTabsOpen = c.otherTabBefore;
        const { legacyDb, localSyncState, calls, ensureSynced, destroy } =
          createLegacyDbMock();
        ensureSynced.mockImplementation(async () => {
          calls.push("final sync");
          multiTabDetection.isMultipleTabsOpen ||= c.otherTabDuringSync;
          if (c.finalSyncFails) {
            throw new Error("offline");
          }
        });
        destroy.mockImplementation(async () => {
          calls.push("delete");
          if (c.deletionFails) {
            throw new DOMException("deletion failed");
          }
        });

        service.startMigrationIfPending(session, legacyDb, PENDING_CONFIG);
        localSyncState.next(SyncState.COMPLETED);
        await flushPromises();

        expect(confirmationDialogSpy.getConfirmation).toHaveBeenCalledTimes(
          c.otherTabBefore ? 0 : 1,
        );
        expect(calls).toEqual(c.expectedCalls);
        expect(alertServiceSpy.addWarning).toHaveBeenCalledTimes(
          c.warned ? 1 : 0,
        );
        expect(localStorage.getItem(MIGRATED_FLAG)).toBeNull();
        expect(mockWindow.location.reload).toHaveBeenCalledTimes(
          c.reloaded ? 1 : 0,
        );
      },
    );

    it("warns the user about a failed final sync even if usage analytics fails", async () => {
      confirmationDialogSpy.getConfirmation.mockResolvedValue(true);
      const { legacyDb, localSyncState, ensureSynced } = createLegacyDbMock();
      ensureSynced.mockRejectedValue(new Error("offline"));
      eventTrackSpy.mockImplementation(() => {
        throw new Error("analytics broken");
      });
      const errorSpy = vi.spyOn(Logging, "error");

      service.startMigrationIfPending(session, legacyDb, PENDING_CONFIG);
      localSyncState.next(SyncState.COMPLETED);
      await flushPromises();

      expect(alertServiceSpy.addWarning).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
