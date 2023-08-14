import { TestBed } from "@angular/core/testing";

import { CouchdbAuthService } from "./couchdb-auth.service";
import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from "@angular/common/http";
import { of, throwError } from "rxjs";
import {
  TEST_PASSWORD,
  TEST_USER,
} from "../../../../utils/mocked-testing.module";

describe("CouchdbAuthService", () => {
  let service: CouchdbAuthService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let dbUser = { name: TEST_USER, roles: ["user_app"] };

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj(["get", "post", "put"]);
    mockHttpClient.get.and.returnValue(throwError(() => new Error()));
    mockHttpClient.post.and.callFake((_url, body) => {
      if (body.name === TEST_USER && body.password === TEST_PASSWORD) {
        return of(dbUser as any);
      } else {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: HttpStatusCode.Unauthorized,
            }),
        );
      }
    });

    TestBed.configureTestingModule({
      providers: [
        CouchdbAuthService,
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });
    service = TestBed.inject(CouchdbAuthService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return the current user after successful login", async () => {
    const user = await service.authenticate(TEST_USER, TEST_PASSWORD);
    expect(user).toEqual(dbUser);
  });

  it("should login, given that CouchDB cookie is still valid", async () => {
    const responseObject = {
      ok: true,
      userCtx: dbUser,
      info: {
        authentication_handlers: ["cookie", "default"],
        authenticated: "default",
      },
    };
    mockHttpClient.get.and.returnValue(of(responseObject));
    const user = await service.autoLogin();

    expect(user).toEqual(responseObject.userCtx);
  });

  it("should not login, given that there is no valid CouchDB cookie", () => {
    const responseObject = {
      ok: true,
      userCtx: {
        name: null,
        roles: [],
      },
      info: {
        authentication_handlers: ["cookie", "default"],
      },
    };
    mockHttpClient.get.and.returnValue(of(responseObject));
    return expectAsync(service.autoLogin()).toBeRejected();
  });

  it("should reject if current user cant be fetched", () => {
    mockHttpClient.get.and.returnValue(throwError(() => new Error()));

    return expectAsync(
      service.changePassword("username", "wrongPW", ""),
    ).toBeRejected();
  });

  it("should report error when new Password cannot be saved", async () => {
    mockHttpClient.get.and.returnValues(of({}));
    mockHttpClient.put.and.returnValue(throwError(() => new Error()));

    await expectAsync(
      service.changePassword("username", "testPW", ""),
    ).toBeRejected();
    expect(mockHttpClient.get).toHaveBeenCalled();
    expect(mockHttpClient.put).toHaveBeenCalled();
  });

  it("should not fail if get and put requests are successful", () => {
    mockHttpClient.get.and.returnValues(of({}));
    mockHttpClient.put.and.returnValues(of({}));

    return expectAsync(
      service.changePassword("username", "testPW", "newPW"),
    ).not.toBeRejected();
  });
});
