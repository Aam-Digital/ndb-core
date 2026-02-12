import { fakeAsync, tick } from "@angular/core/testing";

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

describe("SyncedPouchDatabase", () => {
  let service: SyncedPouchDatabase;

  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;
  let mockNavigator;
  let mockSyncStateSubject: SyncStateSubject;
  let loginState: LoginStateSubject;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj(["login", "addAuthHeader"]);
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
  function stopPeriodicTimer() {
    service.liveSyncEnabled = false;
    tick(service.SYNC_INTERVAL + 500);
  }

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  /**
   * Set up a mocked db and localDb for tests and override the TestBed service provider.
   */
  function mockPouchDatabaseService(): {
    mockLocalDb: jasmine.SpyObj<PouchDB.Database>;
    db: PouchDatabase;
  } {
    mockSyncStateSubject.next(SyncState.UNSYNCED);
    const mockLocalDb = jasmine.createSpyObj(["sync"]);
    mockLocalDb.sync.and.resolveTo({});

    const db = service;
    spyOn(db, "getPouchDB").and.returnValue(mockLocalDb);
    return { mockLocalDb, db };
  }

  it("should restart the sync if it fails at one point", fakeAsync(() => {
    const { mockLocalDb } = mockPouchDatabaseService();

    loginState.next(LoginState.LOGGED_IN);

    tick(1000);
    expect(mockLocalDb.sync).toHaveBeenCalled();

    mockLocalDb.sync.calls.reset();
    mockLocalDb.sync.and.rejectWith("sync request server error");
    tick(service.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalled();
    // expect no errors thrown in service

    // continue sync intervals
    mockLocalDb.sync.calls.reset();
    mockLocalDb.sync.and.resolveTo({});
    tick(service.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalled();

    stopPeriodicTimer();
  }));

  it("should sync immediately when local db has changes", fakeAsync(() => {
    const { mockLocalDb, db } = mockPouchDatabaseService();
    const mockChanges = new Subject();
    spyOn(db, "changes").and.returnValue(mockChanges);

    loginState.next(LoginState.LOGGED_IN);

    service.liveSync();

    tick(1000);
    expect(mockLocalDb.sync).toHaveBeenCalled();
    mockLocalDb.sync.calls.reset();
    expect(mockLocalDb.sync).not.toHaveBeenCalled();

    // simulate local doc written
    mockChanges.next({});
    tick(500); // sync has a short debounce time
    expect(mockLocalDb.sync).toHaveBeenCalled();

    stopPeriodicTimer();
  }));

  it("should skip sync calls when offline", fakeAsync(() => {
    const { mockLocalDb } = mockPouchDatabaseService();

    mockNavigator.onLine = false;

    service.liveSync();

    tick(1000);
    expect(mockLocalDb.sync).not.toHaveBeenCalled();

    mockNavigator.onLine = true;
    tick(service.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalled();

    stopPeriodicTimer();
  }));

  it("should not start additional syncs while a previous sync is still running", fakeAsync(() => {
    const LONG_SYNC_TIME = 100000;

    const { mockLocalDb } = mockPouchDatabaseService();
    mockLocalDb.sync.and.callFake(
      // @ts-ignore
      async () => await new Promise((r) => setTimeout(r, LONG_SYNC_TIME)),
    );

    service.liveSync();

    tick(service.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalledTimes(1);

    tick(service.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalledTimes(1);

    tick(LONG_SYNC_TIME);
    expect(mockLocalDb.sync).toHaveBeenCalledTimes(2);

    // stop periodic timer:
    service.liveSyncEnabled = false;
    tick(LONG_SYNC_TIME);
  }));

  it("should emit changes from the remoteDatabase changes feed if in remote-only mode", fakeAsync(() => {
    // Initialize service in remote-only mode by passing null as dbName
    service.init(null);
    tick();

    // Create a spy on the remoteDatabase to simulate changes
    const remoteChanges = new Subject();
    const remoteDatabase = service["remoteDatabase"];
    spyOn(remoteDatabase, "changes").and.returnValue(remoteChanges);

    // Set up a spy to capture emitted changes
    const changesSpy = jasmine.createSpy("changesSpy");
    service.changes().subscribe(changesSpy);
    tick();

    // Emit a change from the remote database
    const mockChange = { id: "test-doc", seq: 1 };
    remoteChanges.next(mockChange);
    tick();

    // Verify the change was forwarded to the service's changes feed
    expect(changesSpy).toHaveBeenCalledWith(mockChange);
  }));

  it("should trigger one full sync run without checkpoints", async () => {
    const syncSpy = spyOn(service, "sync").and.resolveTo({} as any);
    spyOnProperty(service, "isInRemoteOnlyMode", "get").and.returnValue(false);

    await service.resetSync();

    expect(syncSpy).toHaveBeenCalledWith({ checkpoint: false });
  });

  it("should skip resetSync if only remote", async () => {
    const syncSpy = spyOn(service, "sync").and.resolveTo({} as any);
    spyOnProperty(service, "isInRemoteOnlyMode", "get").and.returnValue(true);

    await service.resetSync();

    expect(syncSpy).not.toHaveBeenCalled();
  });
});
