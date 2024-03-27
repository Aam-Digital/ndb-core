import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { SyncService } from "./sync.service";
import { PouchDatabase } from "./pouch-database";
import { Database } from "./database";
import { LoginStateSubject, SyncStateSubject } from "../session/session-type";
import { LoginState } from "../session/session-states/login-state.enum";
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";
import { HttpStatusCode } from "@angular/common/http";
import PouchDB from "pouchdb-browser";

describe("SyncService", () => {
  let service: SyncService;
  let loginState: LoginStateSubject;
  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj(["login", "addAuthHeader"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: KeycloakAuthService, useValue: mockAuthService },
        { provide: Database, useClass: PouchDatabase },
        LoginStateSubject,
        SyncStateSubject,
      ],
    });
    service = TestBed.inject(SyncService);
    loginState = TestBed.inject(LoginStateSubject);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should restart the sync if it fails at one point", fakeAsync(() => {
    const mockLocalDb = jasmine.createSpyObj(["sync"]);
    spyOn(
      TestBed.inject(Database) as PouchDatabase,
      "getPouchDB",
    ).and.returnValue(mockLocalDb);

    loginState.next(LoginState.LOGGED_IN);

    service.startSync();

    mockLocalDb.sync.and.resolveTo({});
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

    service.liveSyncEnabled = false;
    tick(SyncService.SYNC_INTERVAL);
  }));

  it("should try auto-login if fetch fails and fetch again", async () => {
    // Make sync call pass
    spyOn(
      TestBed.inject(Database) as PouchDatabase,
      "getPouchDB",
    ).and.returnValues({ sync: () => Promise.resolve() } as any);
    spyOn(PouchDB, "fetch").and.returnValues(
      Promise.resolve({
        status: HttpStatusCode.Unauthorized,
        ok: false,
      } as Response),
      Promise.resolve({ status: HttpStatusCode.Ok, ok: true } as Response),
    );
    // providing "valid" token on second call
    let calls = 0;
    mockAuthService.addAuthHeader.and.callFake((headers) => {
      headers.Authorization = calls++ === 1 ? "valid" : "invalid";
    });
    mockAuthService.login.and.resolveTo();
    const initSpy = spyOn(service["remoteDatabase"], "initRemoteDB");
    await service.startSync();
    // taking fetch function from init call
    const fetch = initSpy.calls.mostRecent().args[1];

    const url = "/db/_changes";
    const opts = { headers: {} };
    await expectAsync(fetch(url, opts)).toBeResolved();

    expect(PouchDB.fetch).toHaveBeenCalledTimes(2);
    expect(PouchDB.fetch).toHaveBeenCalledWith(url, opts);
    expect(opts.headers).toEqual({ Authorization: "valid" });
    expect(mockAuthService.login).toHaveBeenCalled();
    expect(mockAuthService.addAuthHeader).toHaveBeenCalledTimes(2);

    service.liveSyncEnabled = false;
  });
});
