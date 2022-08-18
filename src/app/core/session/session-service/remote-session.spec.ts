import { TestBed } from "@angular/core/testing";
import { RemoteSession } from "./remote-session";
import { HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import { SessionType } from "../session-type";
import { LoggingService } from "../../logging/logging.service";
import { testSessionServiceImplementation } from "./session.service.spec";
import { LoginState } from "../session-states/login-state.enum";
import { TEST_PASSWORD, TEST_USER } from "../../../utils/mocked-testing.module";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../auth/auth.service";

describe("RemoteSessionService", () => {
  let service: RemoteSession;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    environment.session_type = SessionType.mock;
    mockAuthService = jasmine.createSpyObj(["authenticate", "logout"]);
    // Remote session allows TEST_USER and TEST_PASSWORD as valid credentials
    mockAuthService.authenticate.and.callFake(async (u, p) => {
      if (u === TEST_USER && p === TEST_PASSWORD) {
        return { name: TEST_USER, roles: ["user_app"] };
      } else {
        throw new HttpErrorResponse({
          status: HttpStatusCode.Unauthorized,
        });
      }
    });

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
      new HttpErrorResponse({ status: 501 })
    );

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.loginState.value).toBe(LoginState.UNAVAILABLE);
  });

  testSessionServiceImplementation(() => Promise.resolve(service));
});
