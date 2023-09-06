import { TestBed } from "@angular/core/testing";
import { RemoteSession } from "./remote-session";
import { HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import { SessionType } from "../session-type";
import { LoggingService } from "../../logging/logging.service";
import { testSessionServiceImplementation } from "./session.service.spec";
import { LoginState } from "../session-states/login-state.enum";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "../auth/auth-user";
import PouchDB from "pouchdb-browser";
import { TEST_PASSWORD, TEST_USER } from "../../../utils/mock-local-session";

export function mockAuth(user: AuthUser) {
  return (u: string, p: string) => {
    if (u === TEST_USER && p === TEST_PASSWORD) {
      return Promise.resolve(user);
    } else {
      return Promise.reject(
        new HttpErrorResponse({
          status: HttpStatusCode.Unauthorized,
        }),
      );
    }
  };
}

describe("RemoteSessionService", () => {
  let service: RemoteSession;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  const testUser: AuthUser = { name: TEST_USER, roles: ["user_app"] };

  beforeEach(() => {
    environment.session_type = SessionType.mock;
    mockAuthService = jasmine.createSpyObj([
      "authenticate",
      "logout",
      "addAuthHeader",
      "autoLogin",
    ]);
    // Remote session allows TEST_USER and TEST_PASSWORD as valid credentials
    mockAuthService.authenticate.and.callFake(mockAuth(testUser));

    TestBed.configureTestingModule({
      providers: [
        RemoteSession,
        LoggingService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(RemoteSession);
  });

  it("should be unavailable if requests fails with error other than 401", async () => {
    mockAuthService.authenticate.and.rejectWith(
      new HttpErrorResponse({ status: 501 }),
    );

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.loginState.value).toBe(LoginState.UNAVAILABLE);
  });

  it("should try auto-login if fetch fails and fetch again", async () => {
    const initSpy = spyOn(service["database"], "initRemoteDB");
    spyOn(PouchDB, "fetch").and.returnValues(
      Promise.resolve({
        status: HttpStatusCode.Unauthorized,
        ok: false,
      } as Response),
      Promise.resolve({ status: HttpStatusCode.Ok, ok: true } as Response),
    );
    let calls = 0;
    mockAuthService.addAuthHeader.and.callFake((headers) => {
      headers.Authorization = calls++ === 1 ? "valid" : "invalid";
    });
    mockAuthService.autoLogin.and.resolveTo();
    await service.handleSuccessfulLogin(testUser);
    const fetch = initSpy.calls.mostRecent().args[1];

    const url = "/db/_changes";
    const opts = { headers: {} };
    await expectAsync(fetch(url, opts)).toBeResolved();

    expect(PouchDB.fetch).toHaveBeenCalledTimes(2);
    expect(PouchDB.fetch).toHaveBeenCalledWith(url, opts);
    expect(opts.headers).toEqual({ Authorization: "valid" });
    expect(mockAuthService.autoLogin).toHaveBeenCalled();
    expect(mockAuthService.addAuthHeader).toHaveBeenCalledTimes(2);
  });

  testSessionServiceImplementation(() => Promise.resolve(service));
});
