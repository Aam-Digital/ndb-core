import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { SyncService } from "./sync.service";
import { PouchDatabase } from "./pouch-database";
import { Database } from "./database";
import { LoginStateSubject } from "../session/session-type";
import { LoginState } from "../session/session-states/login-state.enum";
import { BehaviorSubject } from "rxjs";

describe("SyncService", () => {
  let service: SyncService;
  let mockDatabase: jasmine.SpyObj<PouchDatabase>;
  let loginStateSubject: LoginStateSubject;

  beforeEach(() => {
    loginStateSubject = new BehaviorSubject(LoginState.LOGGED_IN);
    mockDatabase = jasmine.createSpyObj(["getPouchDB"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: Database, useValue: mockDatabase },
        { provide: LoginStateSubject, useValue: loginStateSubject },
      ],
    });
    service = TestBed.inject(SyncService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should restart the sync if it fails at one point", fakeAsync(() => {
    let errorCallback, pauseCallback;
    const syncHandle = {
      on: (action, callback) => {
        if (action === "error") {
          errorCallback = callback;
        }
        if (action === "paused") {
          pauseCallback = callback;
        }
        return syncHandle;
      },
      cancel: () => undefined,
    };
    const syncSpy = jasmine.createSpy().and.returnValue(syncHandle);
    mockDatabase.getPouchDB.and.returnValue({ sync: syncSpy } as any);

    service.startSync();
    tick();

    // error -> sync should restart
    syncSpy.calls.reset();
    errorCallback();
    expect(syncSpy).toHaveBeenCalled();

    // pause -> no restart required
    syncSpy.calls.reset();
    pauseCallback();
    expect(syncSpy).not.toHaveBeenCalled();

    // logout + error -> no restart
    syncSpy.calls.reset();
    loginStateSubject.next(LoginState.LOGGED_OUT);
    tick();
    errorCallback();
    expect(syncSpy).not.toHaveBeenCalled();
  }));

  // TODO need to access initRemoteDB somehow
  // it("should try auto-login if fetch fails and fetch again", async () => {
  //   const initSpy = spyOn(service["database"], "initRemoteDB");
  //   spyOn(PouchDB, "fetch").and.returnValues(
  //     Promise.resolve({
  //       status: HttpStatusCode.Unauthorized,
  //       ok: false,
  //     } as Response),
  //     Promise.resolve({ status: HttpStatusCode.Ok, ok: true } as Response),
  //   );
  //   let calls = 0;
  //   mockAuthService.addAuthHeader.and.callFake((headers) => {
  //     headers.Authorization = calls++ === 1 ? "valid" : "invalid";
  //   });
  //   mockAuthService.autoLogin.and.resolveTo();
  //   await service.handleSuccessfulLogin(testUser);
  //   const fetch = initSpy.calls.mostRecent().args[1];
  //
  //   const url = "/db/_changes";
  //   const opts = { headers: {} };
  //   await expectAsync(fetch(url, opts)).toBeResolved();
  //
  //   expect(PouchDB.fetch).toHaveBeenCalledTimes(2);
  //   expect(PouchDB.fetch).toHaveBeenCalledWith(url, opts);
  //   expect(opts.headers).toEqual({ Authorization: "valid" });
  //   expect(mockAuthService.autoLogin).toHaveBeenCalled();
  //   expect(mockAuthService.addAuthHeader).toHaveBeenCalledTimes(2);
  // });
});
