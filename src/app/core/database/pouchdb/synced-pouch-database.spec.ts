import type { Mock } from "vitest";

import { PouchDatabase } from "./pouch-database";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "../../session/session-type";
import { LoginState } from "../../session/session-states/login-state.enum";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { Subject } from "rxjs";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { SyncedPouchDatabase } from "./synced-pouch-database";
import { NotAvailableOfflineError } from "../../session/not-available-offline.error";

describe("SyncedPouchDatabase", () => {
  let service: SyncedPouchDatabase;

  let mockAuthService: any;
  let mockNavigator;
  let mockSyncStateSubject: SyncStateSubject;
  let loginState: LoginStateSubject;

  beforeEach(() => {
    mockAuthService = {
      login: vi.fn(),
      addAuthHeader: vi.fn(),
    };
    mockNavigator = { onLine: true };
    mockSyncStateSubject = new SyncStateSubject();
    loginState = new LoginStateSubject();

    service = new SyncedPouchDatabase(
      "unit-test-db",
      mockAuthService,
      mockSyncStateSubject,
      mockNavigator,
      loginState,
    );
  });

  /**
   * ensure the interval for sync is stopped at end of test to avoid errors.
   * Somehow this does not work in afterEach().
   */
  async function stopPeriodicTimer() {
    service.liveSyncEnabled = false;
    await vi.advanceTimersByTimeAsync(service.SYNC_INTERVAL + 500);
  }

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  /**
   * Set up a mocked db and localDb for tests and override the TestBed service provider.
   */
  function mockPouchDatabaseService(): {
    mockLocalDb: any;
    db: PouchDatabase;
  } {
    mockSyncStateSubject.next(SyncState.UNSYNCED);
    const mockLocalDb = {
      sync: vi.fn(),
    };
    mockLocalDb.sync.mockResolvedValue({});

    const db = service;
    vi.spyOn(db, "getPouchDB").mockReturnValue(mockLocalDb as any);
    return { mockLocalDb, db };
  }

  it("should restart the sync if it fails at one point", async () => {
    vi.useFakeTimers();
    try {
      const { mockLocalDb } = mockPouchDatabaseService();

      loginState.next(LoginState.LOGGED_IN);

      await vi.advanceTimersByTimeAsync(1000);
      expect(mockLocalDb.sync).toHaveBeenCalled();

      mockLocalDb.sync.mockClear();
      mockLocalDb.sync.mockRejectedValue("sync request server error");
      await vi.advanceTimersByTimeAsync(service.SYNC_INTERVAL);
      expect(mockLocalDb.sync).toHaveBeenCalled();
      // expect no errors thrown in service

      // continue sync intervals
      mockLocalDb.sync.mockClear();
      mockLocalDb.sync.mockResolvedValue({});
      await vi.advanceTimersByTimeAsync(service.SYNC_INTERVAL);
      expect(mockLocalDb.sync).toHaveBeenCalled();

      await stopPeriodicTimer();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should sync immediately when local db has changes", async () => {
    vi.useFakeTimers();
    try {
      const { mockLocalDb, db } = mockPouchDatabaseService();
      const mockChanges = new Subject();
      vi.spyOn(db, "changes").mockReturnValue(mockChanges);

      loginState.next(LoginState.LOGGED_IN);

      service.liveSync();

      await vi.advanceTimersByTimeAsync(1000);
      expect(mockLocalDb.sync).toHaveBeenCalled();
      mockLocalDb.sync.mockClear();
      expect(mockLocalDb.sync).not.toHaveBeenCalled();

      // simulate local doc written
      mockChanges.next({});
      await vi.advanceTimersByTimeAsync(500); // sync has a short debounce time
      expect(mockLocalDb.sync).toHaveBeenCalled();

      await stopPeriodicTimer();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should skip sync calls when offline", async () => {
    vi.useFakeTimers();
    try {
      const { mockLocalDb } = mockPouchDatabaseService();

      mockNavigator.onLine = false;

      service.liveSync();

      await vi.advanceTimersByTimeAsync(1000);
      expect(mockLocalDb.sync).not.toHaveBeenCalled();

      mockNavigator.onLine = true;
      await vi.advanceTimersByTimeAsync(service.SYNC_INTERVAL);
      expect(mockLocalDb.sync).toHaveBeenCalled();

      await stopPeriodicTimer();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not start additional syncs while a previous sync is still running", async () => {
    vi.useFakeTimers();
    try {
      const LONG_SYNC_TIME = 100000;

      const { mockLocalDb } = mockPouchDatabaseService();
      mockLocalDb.sync.mockImplementation(
        // @ts-ignore
        async () => await new Promise((r) => setTimeout(r, LONG_SYNC_TIME)),
      );

      service.liveSync();

      await vi.advanceTimersByTimeAsync(service.SYNC_INTERVAL);
      expect(mockLocalDb.sync).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(service.SYNC_INTERVAL);
      expect(mockLocalDb.sync).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(LONG_SYNC_TIME);
      expect(mockLocalDb.sync).toHaveBeenCalledTimes(2);

      // stop periodic timer:
      service.liveSyncEnabled = false;
      await vi.advanceTimersByTimeAsync(LONG_SYNC_TIME);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should emit changes from the remoteDatabase changes feed if in remote-only mode", async () => {
    vi.useFakeTimers();
    try {
      // Initialize service in remote-only mode by passing null as dbName
      service.init(null);
      await vi.advanceTimersByTimeAsync(0);

      // Create a spy on the remoteDatabase to simulate changes
      const remoteChanges = new Subject();
      const remoteDatabase = service["remoteDatabase"];
      vi.spyOn(remoteDatabase, "changes").mockReturnValue(remoteChanges);

      // Set up a spy to capture emitted changes
      const changesSpy = vi.fn();
      service.changes().subscribe(changesSpy);
      await vi.advanceTimersByTimeAsync(0);

      // Emit a change from the remote database
      const mockChange = { id: "test-doc", seq: 1 };
      remoteChanges.next(mockChange);
      await vi.advanceTimersByTimeAsync(0);

      // Verify the change was forwarded to the service's changes feed
      expect(changesSpy).toHaveBeenCalledWith(mockChange);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should trigger one full sync run without checkpoints", async () => {
    const syncSpy = vi.spyOn(service, "sync").mockResolvedValue({} as any);
    vi.spyOn(service, "isInRemoteOnlyMode", "get").mockReturnValue(false);

    await service.resetSync();

    expect(syncSpy).toHaveBeenCalledWith({ checkpoint: false });
  });

  it("should skip resetSync if only remote", async () => {
    const syncSpy = vi.spyOn(service, "sync").mockResolvedValue({} as any);
    vi.spyOn(service, "isInRemoteOnlyMode", "get").mockReturnValue(true);

    await service.resetSync();

    expect(syncSpy).not.toHaveBeenCalled();
  });

  it("ensureSynced should resolve without syncing in remote-only mode", async () => {
    const syncSpy = vi.spyOn(service, "sync").mockResolvedValue({} as any);
    vi.spyOn(service, "isInRemoteOnlyMode", "get").mockReturnValue(true);

    await service.ensureSynced();

    expect(syncSpy).not.toHaveBeenCalled();
  });

  it("ensureSynced should throw NotAvailableOfflineError when offline", async () => {
    vi.spyOn(service, "sync").mockResolvedValue({} as any);
    vi.spyOn(service, "isInRemoteOnlyMode", "get").mockReturnValue(false);
    mockNavigator.onLine = false;

    await expect(service.ensureSynced()).rejects.toThrowError(
      NotAvailableOfflineError,
    );
  });

  it("ensureSynced should call sync when online and not remote-only", async () => {
    const syncSpy = vi.spyOn(service, "sync").mockImplementation(async () => {
      service["syncState"].next(SyncState.COMPLETED);
      return {} as any;
    });
    vi.spyOn(service, "isInRemoteOnlyMode", "get").mockReturnValue(false);
    mockNavigator.onLine = true;

    await service.ensureSynced();

    expect(syncSpy).toHaveBeenCalled();
  });

  it("ensureSynced should throw NotAvailableOfflineError when sync ends UNSYNCED", async () => {
    const syncSpy = vi.spyOn(service, "sync").mockImplementation(async () => {
      service["syncState"].next(SyncState.UNSYNCED);
      return {} as any;
    });
    vi.spyOn(service, "isInRemoteOnlyMode", "get").mockReturnValue(false);
    mockNavigator.onLine = true;

    await expect(service.ensureSynced()).rejects.toThrowError(
      NotAvailableOfflineError,
    );
    expect(syncSpy).toHaveBeenCalled();
  });

  describe("purgeDocsWithLostPermissions", () => {
    let purgeSpy: Mock;

    beforeEach(() => {
      const mockLocalDb = {
        sync: vi.fn(),
      };
      mockLocalDb.sync.mockResolvedValue({});
      vi.spyOn(service, "getPouchDB").mockReturnValue(mockLocalDb as any);
      purgeSpy = vi.spyOn(service, "purge").mockResolvedValue(true);
    });

    it("should purge local docs reported in lostPermissions after sync", async () => {
      vi.spyOn(
        service["remoteDatabase"],
        "collectAndClearLostPermissions",
      ).mockReturnValue(["Child:1", "School:2"]);

      await service.sync();

      expect(purgeSpy).toHaveBeenCalledWith("Child:1");
      expect(purgeSpy).toHaveBeenCalledWith("School:2");
    });

    it("should not purge anything if no permissions were lost", async () => {
      vi.spyOn(
        service["remoteDatabase"],
        "collectAndClearLostPermissions",
      ).mockReturnValue([]);

      await service.sync();

      expect(purgeSpy).not.toHaveBeenCalled();
    });

    it("should skip gracefully if purge returns false (doc not found locally)", async () => {
      purgeSpy.mockResolvedValue(false);
      vi.spyOn(
        service["remoteDatabase"],
        "collectAndClearLostPermissions",
      ).mockReturnValue(["Child:missing"]);

      await expect(service.sync()).resolves.not.toThrow();
    });

    it("should continue purging remaining docs if one fails", async () => {
      purgeSpy.mockImplementation((id: string) =>
        id === "Child:1"
          ? Promise.reject(new Error("unexpected"))
          : Promise.resolve(true),
      );
      vi.spyOn(
        service["remoteDatabase"],
        "collectAndClearLostPermissions",
      ).mockReturnValue(["Child:1", "School:2"]);

      await service.sync();

      expect(purgeSpy).toHaveBeenCalledWith("Child:1");
      expect(purgeSpy).toHaveBeenCalledWith("School:2");
    });
  });
});
