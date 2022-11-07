import { TestBed } from "@angular/core/testing";

import { AUTH_ENABLED, AuthInterceptor } from "./auth.interceptor";
import { AuthService } from "./auth.service";
import { HttpContext } from "@angular/common/http";

describe("AuthInterceptor", () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj(["addAuthHeader"]);
    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  });

  it("should be created", () => {
    const interceptor: AuthInterceptor = TestBed.inject(AuthInterceptor);
    expect(interceptor).toBeTruthy();
  });

  it("should add an auth header to a request", () => {
    const request = {
      clone: jasmine.createSpy(),
      context: new HttpContext().set(AUTH_ENABLED, true),
    };
    mockAuthService.addAuthHeader.and.callFake(
      (obj) => (obj["Authorization"] = "my-auth-header")
    );

    const interceptor: AuthInterceptor = TestBed.inject(AuthInterceptor);
    interceptor.intercept(request as any, { handle: () => undefined });

    expect(request.clone).toHaveBeenCalledWith({
      setHeaders: { Authorization: "my-auth-header" },
    });
  });
});
