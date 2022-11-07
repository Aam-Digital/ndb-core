import { TestBed } from "@angular/core/testing";

import { AUTH_ENABLED, AuthInterceptor } from "./auth.interceptor";
import { AuthService } from "./auth.service";
import {
  HttpContext,
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
  HttpStatusCode,
} from "@angular/common/http";
import { of, throwError } from "rxjs";

describe("AuthInterceptor", () => {
  let interceptor: AuthInterceptor;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  const mockRequest = {
    clone: () => mockRequest,
    context: new HttpContext().set(AUTH_ENABLED, true),
  } as HttpRequest<any>;
  const mockNext = {
    handle: jasmine.createSpy().and.returnValue(of(undefined)),
  };

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj(["addAuthHeader", "autoLogin"]);
    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    interceptor = TestBed.inject(AuthInterceptor);
  });

  it("should be created", () => {
    expect(interceptor).toBeTruthy();
  });

  it("should add an auth header to a request", () => {
    mockAuthService.addAuthHeader.and.callFake(
      (obj) => (obj["Authorization"] = "my-auth-header")
    );

    interceptor.intercept(mockRequest, mockNext);

    expect(mockRequest.clone).toHaveBeenCalledWith({
      setHeaders: { Authorization: "my-auth-header" },
    });
  });

  it("should should retry request with updated auth when receiving unauthorized response", (done) => {
    const errorResponse = new HttpErrorResponse({
      status: HttpStatusCode.Unauthorized,
    });
    const expectedResponse = new HttpResponse({ status: 200 });
    mockNext.handle.and.returnValues(
      throwError(() => errorResponse),
      of(expectedResponse)
    );
    mockAuthService.autoLogin.and.resolveTo();

    interceptor.intercept(mockRequest, mockNext).subscribe((res) => {
      expect(res).toEqual(expectedResponse);
      expect(mockAuthService.autoLogin).toHaveBeenCalled();
      expect(mockAuthService.addAuthHeader).toHaveBeenCalledTimes(2);
      expect(mockNext.handle).toHaveBeenCalledWith(mockRequest);
      expect(mockNext.handle).toHaveBeenCalledTimes(2);
      done();
    });
  });

  it("should directly return error if it is not an unauthorized response", (done) => {
    const errorResponse = new HttpErrorResponse({
      status: HttpStatusCode.NotFound,
    });
    mockNext.handle.and.returnValue(throwError(() => errorResponse));

    interceptor.intercept(mockRequest, mockNext).subscribe({
      error: (err) => {
        expect(err).toBe(errorResponse);
        expect(mockAuthService.autoLogin).not.toHaveBeenCalled();
        expect(mockNext.handle).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });
});
