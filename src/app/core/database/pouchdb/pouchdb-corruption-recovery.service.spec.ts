import { TestBed } from "@angular/core/testing";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { LOCATION_TOKEN } from "#src/app/utils/di-tokens";
import {
  isKnownMultiTabDatabaseCorruption,
  PouchdbCorruptionRecoveryService,
} from "./pouchdb-corruption-recovery.service";
import { RESET_PENDING_KEY } from "#src/bootstrap-reset";
import { environment } from "../../../../environments/environment";
import { SessionType } from "../../session/session-type";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { PouchDatabase } from "./pouch-database";
import { Logging } from "../../logging/logging.service";

describe("PouchdbCorruptionRecoveryService", () => {
  let service: PouchdbCorruptionRecoveryService;
  let confirmationDialog: { getConfirmation: ReturnType<typeof vi.fn> };
  let location: { pathname: string };

  beforeEach(() => {
    // Defensive reset of the global session_type, in case a prior test (in
    // this file or another) left it in a non-default state.
    environment.session_type = SessionType.mock;

    confirmationDialog = {
      getConfirmation: vi.fn(),
    };
    location = { pathname: "/entities/Entity:1" };

    TestBed.configureTestingModule({
      providers: [
        PouchdbCorruptionRecoveryService,
        { provide: ConfirmationDialogService, useValue: confirmationDialog },
        { provide: LOCATION_TOKEN, useValue: location },
      ],
    });

    service = TestBed.inject(PouchdbCorruptionRecoveryService);
    // Reset internal singleton state to prevent leakage from prior tests
    // (the service is `providedIn: 'root'` so it may persist).
    (service as any).warningDialogOpen = false;
    (service as any).resetDialogOpen = false;
    localStorage.clear();
    sessionStorage.removeItem(RESET_PENDING_KEY);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.removeItem(RESET_PENDING_KEY);
  });

  it("should reset application state when user confirms", async () => {
    localStorage.setItem("foo", "bar");
    confirmationDialog.getConfirmation.mockResolvedValue(true);

    await service.promptResetApplicationDialog();

    expect(localStorage.getItem("foo")).toBe("bar");
    expect(sessionStorage.getItem(RESET_PENDING_KEY)).toBe("1");
    expect(location.pathname).toBe("");
  });

  it("should show multi-tab warning dialog without resetting state", async () => {
    localStorage.setItem("foo", "bar");
    confirmationDialog.getConfirmation.mockResolvedValue(true);

    await service.promptMultiTabWarningDialog();

    expect(confirmationDialog.getConfirmation).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("foo")).toBe("bar");
    expect(sessionStorage.getItem(RESET_PENDING_KEY)).toBeNull();
    expect(location.pathname).toBe("/entities/Entity:1");
  });

  it("should skip multi-tab warning dialog in online-only mode", async () => {
    environment.session_type = SessionType.online;
    try {
      await service.promptMultiTabWarningDialog();
      expect(confirmationDialog.getConfirmation).not.toHaveBeenCalled();
    } finally {
      environment.session_type = SessionType.mock;
    }
  });

  it("should show multi-tab warning again when prompted again", async () => {
    confirmationDialog.getConfirmation.mockResolvedValue(true);

    await service.promptMultiTabWarningDialog();
    await service.promptMultiTabWarningDialog();
    expect(confirmationDialog.getConfirmation).toHaveBeenCalledTimes(2);
  });

  it("should keep application state when user cancels", async () => {
    localStorage.setItem("foo", "bar");
    confirmationDialog.getConfirmation.mockResolvedValue(false);

    await service.promptResetApplicationDialog();

    expect(localStorage.getItem("foo")).toBe("bar");
    expect(sessionStorage.getItem(RESET_PENDING_KEY)).toBeNull();
    expect(location.pathname).toBe("/entities/Entity:1");
  });

  describe("detecting an outdated sequence counter of the local database", () => {
    const originalIndexedDB = globalThis.indexedDB;
    const originalIDBKeyRange = globalThis.IDBKeyRange;

    beforeEach(() => {
      // a real IndexedDB for PouchDB's "indexeddb" adapter (jsdom has none)
      globalThis.indexedDB = new IDBFactory();
      globalThis.IDBKeyRange = IDBKeyRange;
      // the adapter logs the aborted transaction ("Database has a global failure")
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      vi.spyOn(Logging, "warn").mockImplementation(() => undefined);
      confirmationDialog.getConfirmation.mockResolvedValue(false);
    });

    afterEach(() => {
      globalThis.indexedDB = originalIndexedDB;
      globalThis.IDBKeyRange = originalIDBKeyRange;
      vi.restoreAllMocks();
    });

    async function openLocalDb(name: string): Promise<PouchDB.Database> {
      const db = new PouchDatabase(name);
      db.init();
      return db.getPouchDB();
    }

    async function createLocalDbWithDocs(name: string, count: number) {
      const db = await openLocalDb(name);
      for (let i = 0; i < count; i++) {
        await db.put({ _id: `Child:${i}` });
      }
      return db;
    }

    /** What a tab writing its outdated metadata leaves behind (see `indexeddb-sequence-check.ts`). */
    async function setStoredSequenceCounter(name: string, seq: number) {
      const idb = await new Promise<IDBDatabase>((resolve) => {
        const openRequest = indexedDB.open("_pouch_" + name);
        openRequest.onsuccess = () => resolve(openRequest.result);
      });
      const txn = idb.transaction("meta", "readwrite");
      const store = txn.objectStore("meta");
      store.get("meta").onsuccess = (e) =>
        store.put({ ...(e.target as IDBRequest).result, seq });
      await new Promise((resolve) => (txn.oncomplete = resolve));
      idb.close();
    }

    it("reports a write failing on an outdated sequence counter as corruption", async () => {
      await (await createLocalDbWithDocs("corrupted", 5)).close();
      await setStoredSequenceCounter("corrupted", 2);
      const db = await openLocalDb("corrupted");

      // PouchDB rejects every write with nothing but a generic aborted transaction
      const writeError = await db.put({ _id: "Child:new" }).catch((e) => e);
      expect(writeError).toMatchObject({
        name: "unknown_error",
        reason: "transaction was aborted",
      });

      await expect(
        service.handleKnownMultiTabCorruption(writeError, "put failed", {}, db),
      ).resolves.toBe(true);
      expect(confirmationDialog.getConfirmation).toHaveBeenCalledTimes(1);
    });

    it("does not report an aborted transaction of a consistent database", async () => {
      const db = await createLocalDbWithDocs("consistent", 5);
      // e.g. a document too deeply nested to store aborts the transaction as well
      const writeError = {
        name: "unknown_error",
        message: "Database encountered an unknown error",
        reason: "transaction was aborted",
        status: 500,
      };

      await expect(
        service.handleKnownMultiTabCorruption(writeError, "put failed", {}, db),
      ).resolves.toBe(false);
      expect(confirmationDialog.getConfirmation).not.toHaveBeenCalled();
    });
  });
});

describe("isKnownMultiTabDatabaseCorruption", () => {
  it("should detect seq index constraint errors", () => {
    const error = new Error(
      "Database has a global failure ConstraintError: Unable to add key to index 'seq': at least one key does not satisfy the uniqueness requirements.",
    );
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(true);
  });

  it("should detect unknown_error from IndexedDB adapter failures", () => {
    const error = {
      message: "unknown_error: Database encountered an unknown error",
    };
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(false);
  });

  it("should not detect unknown_error when error is a plain string", () => {
    expect(isKnownMultiTabDatabaseCorruption("unknown_error")).toBe(false);
  });

  it("should not detect an aborted transaction, which other failures cause too", () => {
    // e.g. a RangeError writing a deeply nested document aborts the transaction
    const error = {
      name: "unknown_error",
      message: "Database encountered an unknown error",
      reason: "transaction was aborted",
    };
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(false);
  });

  it("should not classify unrelated validation errors", () => {
    const error = new Error("validation error: invalid field value");
    expect(isKnownMultiTabDatabaseCorruption(error)).toBe(false);
  });

  it("should detect bulk save array errors with seq constraint", () => {
    const bulkError = [
      {
        reason:
          "Database has a global failure ConstraintError: Unable to add key to index 'seq'",
      },
    ];
    expect(isKnownMultiTabDatabaseCorruption(bulkError)).toBe(true);
  });
});
