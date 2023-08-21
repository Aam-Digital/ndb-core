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
import { EMPTY, of, throwError } from "rxjs";

describe("AuthInterceptor", () => {
  let interceptor: AuthInterceptor;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  const mockRequest = {
    clone: () => mockRequest,
    context: new HttpContext().set(AUTH_ENABLED, true),
  } as HttpRequest<any>;

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
      (obj) => (obj["Authorization"] = "my-auth-header"),
    );
    spyOn(mockRequest, "clone");

    interceptor.intercept(mockRequest, { handle: () => EMPTY });

    expect(mockRequest.clone).toHaveBeenCalledWith({
      setHeaders: { Authorization: "my-auth-header" },
    });
  });

  it("should not add an auth header if auth is explicitly disabled", () => {
    const noAuthRequest = {
      context: new HttpContext().set(AUTH_ENABLED, false),
    } as HttpRequest<unknown>;
    const handle = jasmine.createSpy().and.returnValue(EMPTY);

    interceptor.intercept(noAuthRequest, { handle });

    expect(mockAuthService.addAuthHeader).not.toHaveBeenCalled();
    expect(handle).toHaveBeenCalledWith(noAuthRequest);
  });

  it("should should retry request with updated auth when receiving unauthorized response", (done) => {
    const errorResponse = new HttpErrorResponse({
      status: HttpStatusCode.Unauthorized,
    });
    const expectedResponse = new HttpResponse({ status: 200 });
    const handle = jasmine.createSpy().and.returnValues(
      throwError(() => errorResponse),
      of(expectedResponse),
    );
    mockAuthService.autoLogin.and.resolveTo();

    interceptor.intercept(mockRequest, { handle }).subscribe((res) => {
      expect(res).toEqual(expectedResponse);
      expect(mockAuthService.autoLogin).toHaveBeenCalled();
      expect(mockAuthService.addAuthHeader).toHaveBeenCalledTimes(2);
      expect(handle).toHaveBeenCalledWith(mockRequest);
      expect(handle).toHaveBeenCalledTimes(2);
      done();
    });
  });

  it("should directly return error if it is not an unauthorized response", (done) => {
    const errorResponse = new HttpErrorResponse({
      status: HttpStatusCode.NotFound,
    });
    const handle = jasmine
      .createSpy()
      .and.returnValue(throwError(() => errorResponse));

    interceptor.intercept(mockRequest, { handle }).subscribe({
      error: (err) => {
        expect(err).toBe(errorResponse);
        expect(mockAuthService.autoLogin).not.toHaveBeenCalled();
        expect(handle).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });

  it("should throw initial error auth attempt fails", (done) => {
    const initialError = new HttpErrorResponse({
      status: HttpStatusCode.Unauthorized,
    });
    const authError = new HttpErrorResponse({ status: 400 });
    const handle = jasmine
      .createSpy()
      .and.returnValues(throwError(() => initialError));
    mockAuthService.autoLogin.and.rejectWith(authError);

    interceptor.intercept(mockRequest, { handle }).subscribe({
      error: (res) => {
        expect(res).toEqual(initialError);
        expect(mockAuthService.autoLogin).toHaveBeenCalled();
        expect(handle).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });
});
