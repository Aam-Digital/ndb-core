import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { SyncService } from "./sync.service";
import { PouchDatabase } from "./pouch-database";
import { Database } from "./database";
import { LoginStateSubject, SyncStateSubject } from "../session/session-type";
import { LoginState } from "../session/session-states/login-state.enum";
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";

describe("SyncService", () => {
  let service: SyncService;
  let loginState: LoginStateSubject;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: KeycloakAuthService, useValue: {} },
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
    const syncSpy = jasmine
      .createSpy()
      .and.returnValues(Promise.resolve("first"), syncHandle, syncHandle);
    spyOn(
      TestBed.inject(Database) as PouchDatabase,
      "getPouchDB",
    ).and.returnValue({ sync: syncSpy } as any);

    service.startSync();
    tick(1000);

    // error + logged in -> sync should restart
    loginState.next(LoginState.LOGGED_IN);
    syncSpy.calls.reset();
    errorCallback();
    expect(syncSpy).toHaveBeenCalled();

    // pause -> no restart required
    syncSpy.calls.reset();
    pauseCallback();
    expect(syncSpy).not.toHaveBeenCalled();

    // logout + error -> no restart
    syncSpy.calls.reset();
    loginState.next(LoginState.LOGGED_OUT);
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