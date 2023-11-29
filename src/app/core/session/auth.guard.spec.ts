import { TestBed } from "@angular/core/testing";

import { AuthGuard } from "./auth.guard";
import { RouterTestingModule } from "@angular/router/testing";
import { LoginStateSubject } from "./session-type";
import { LoginState } from "./session-states/login-state.enum";

describe("AuthGuard", () => {
  let loginState: LoginStateSubject;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [LoginStateSubject],
    });
    loginState = TestBed.inject(LoginStateSubject);
  });

  it("should be created", () => {
    expect(AuthGuard).toBeTruthy();
  });

  it("should return true if user is logged in", () => {
    loginState.next(LoginState.LOGGED_IN);

    const res = TestBed.runInInjectionContext(() =>
      AuthGuard(undefined, undefined),
    );
    expect(res).toBeTrue();
  });

  it("should navigate to login page with redirect url if not logged in", () => {
    loginState.next(LoginState.LOGGED_OUT);

    const res = TestBed.runInInjectionContext(() =>
      AuthGuard(undefined, { url: "/some/url" } as any),
    );
    expect(res.toString()).toBe("/login?redirect_uri=%2Fsome%2Furl");
  });
});
