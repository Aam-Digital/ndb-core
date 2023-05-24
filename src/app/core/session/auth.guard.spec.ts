import { TestBed } from "@angular/core/testing";

import { AuthGuard } from "./auth.guard";
import { SessionService } from "./session-service/session.service";
import { CanActivateFn, Router } from "@angular/router";

describe("AuthGuard", () => {
  let guard: CanActivateFn;
  let mockSession: jasmine.SpyObj<SessionService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockSession = jasmine.createSpyObj(["isLoggedIn"]);
    mockRouter = jasmine.createSpyObj(["navigate"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: mockSession },
        { provide: Router, useValue: mockRouter },
      ],
    });
    guard = TestBed.inject(AuthGuard);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });

  it("should return true if user is logged in", () => {
    mockSession.isLoggedIn.and.returnValue(true);

    expect(guard(undefined, undefined)).toBeTrue();
  });

  it("should navigate to login page with redirect url if not logged in", () => {
    mockSession.isLoggedIn.and.returnValue(false);

    expect(guard(undefined, { url: "/some/url" } as any)).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/login"], {
      queryParams: { redirect_uri: "/some/url" },
    });
  });
});
