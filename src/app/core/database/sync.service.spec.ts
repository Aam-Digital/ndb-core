import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { SyncService } from "./sync.service";
import { PouchDatabase } from "./pouch-database";
import { Database } from "./database";
import { LoginStateSubject, SyncStateSubject } from "../session/session-type";
import { LoginState } from "../session/session-states/login-state.enum";
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";
import { Subject } from "rxjs";
import { NAVIGATOR_TOKEN } from "../../utils/di-tokens";
import { SyncState } from "../session/session-states/sync-state.enum";

describe("SyncService", () => {
  let service: SyncService;
  let loginState: LoginStateSubject;
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;
  let mockNavigator;

  let mockSyncStateSubject: SyncStateSubject;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj(["login", "addAuthHeader"]);
    mockNavigator = { onLine: true };

    TestBed.configureTestingModule({
      providers: [
        { provide: KeycloakAuthService, useValue: mockAuthService },
        { provide: Database, useClass: PouchDatabase },
        LoginStateSubject,
        SyncStateSubject,
        { provide: NAVIGATOR_TOKEN, useValue: mockNavigator },
      ],
    });
    service = TestBed.inject(SyncService);
    loginState = TestBed.inject(LoginStateSubject);
    mockSyncStateSubject = TestBed.inject(SyncStateSubject);
  });

  /**
   * ensure the interval for sync is stopped at end of test to avoid errors.
   * Somehow this does not work in afterEach().
   */
  function stopPeriodicTimer() {
    service.liveSyncEnabled = false;
    tick(SyncService.SYNC_INTERVAL + 500);
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

    const db = TestBed.inject(Database) as PouchDatabase;
    spyOn(db, "getPouchDB").and.returnValue(mockLocalDb);
    return { mockLocalDb, db };
  }

  it("should restart the sync if it fails at one point", fakeAsync(() => {
    const { mockLocalDb } = mockPouchDatabaseService();

    loginState.next(LoginState.LOGGED_IN);

    service.startSync();

    tick(1000);
    expect(mockLocalDb.sync).toHaveBeenCalled();

    mockLocalDb.sync.calls.reset();
    mockLocalDb.sync.and.rejectWith("sync request server error");
    tick(SyncService.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalled();
    // expect no errors thrown in service

    // continue sync intervals
    mockLocalDb.sync.calls.reset();
    mockLocalDb.sync.and.resolveTo({});
    tick(SyncService.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalled();

    stopPeriodicTimer();
  }));

  it("should sync immediately when local db has changes", fakeAsync(() => {
    const { mockLocalDb, db } = mockPouchDatabaseService();
    const mockChanges = new Subject();
    spyOn(db, "changes").and.returnValue(mockChanges);

    loginState.next(LoginState.LOGGED_IN);

    service.startSync();

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

    service.startSync();

    tick(1000);
    expect(mockLocalDb.sync).not.toHaveBeenCalled();

    mockNavigator.onLine = true;
    tick(SyncService.SYNC_INTERVAL);
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

    service.startSync();

    tick(SyncService.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalledTimes(1);

    tick(SyncService.SYNC_INTERVAL);
    expect(mockLocalDb.sync).toHaveBeenCalledTimes(1);

    tick(LONG_SYNC_TIME);
    expect(mockLocalDb.sync).toHaveBeenCalledTimes(2);

    // stop periodic timer:
    service.liveSyncEnabled = false;
    tick(LONG_SYNC_TIME);
  }));
});
