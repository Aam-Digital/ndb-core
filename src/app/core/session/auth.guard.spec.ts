import { TestBed } from "@angular/core/testing";

import { AuthGuard } from "./auth.guard";
import { SessionService } from "./session-service/session.service";
import { RouterTestingModule } from "@angular/router/testing";

describe("AuthGuard", () => {
  let mockSession: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    mockSession = jasmine.createSpyObj(["isLoggedIn"]);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: SessionService, useValue: mockSession }],
    });
  });

  it("should be created", () => {
    expect(AuthGuard).toBeTruthy();
  });

  it("should return true if user is logged in", () => {
    mockSession.isLoggedIn.and.returnValue(true);

    const res = TestBed.runInInjectionContext(() =>
      AuthGuard(undefined, undefined),
    );
    expect(res).toBeTrue();
  });

  it("should navigate to login page with redirect url if not logged in", () => {
    mockSession.isLoggedIn.and.returnValue(false);

    const res = TestBed.runInInjectionContext(() =>
      AuthGuard(undefined, { url: "/some/url" } as any),
    );
    expect(res.toString()).toBe("/login?redirect_uri=%2Fsome%2Furl");
  });
});
