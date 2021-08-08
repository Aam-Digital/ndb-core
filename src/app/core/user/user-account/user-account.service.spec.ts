import { TestBed } from "@angular/core/testing";
import { UserAccountService } from "./user-account.service";
import { HttpClient } from "@angular/common/http";
import { of, throwError } from "rxjs";

describe("UserAccountService", () => {
  let service: UserAccountService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj("mockHttpClient", ["get", "put"]);
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: mockHttpClient }],
    });
    service = TestBed.inject(UserAccountService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should reject if current user cant be fetched", (done) => {
    mockHttpClient.get.and.returnValue(throwError(new Error()));

    service
      .changePassword("username", "wrongPW", "")
      .then(() => fail())
      .catch((err) => {
        expect(err).toBeDefined();
        done();
      });
  });

  it("should report error when new Password cannot be saved", (done) => {
    mockHttpClient.get.and.returnValues(of({}));
    mockHttpClient.put.and.returnValue(throwError(new Error()));

    service
      .changePassword("username", "testPW", "")
      .then(() => fail())
      .catch((err) => {
        expect(mockHttpClient.get).toHaveBeenCalled();
        expect(mockHttpClient.put).toHaveBeenCalled();
        expect(err).toBeDefined();
        done();
      });
  });

  it("should not fail if get and put requests are successful", () => {
    mockHttpClient.get.and.returnValues(of({}));
    mockHttpClient.put.and.returnValues(of({}));

    return expectAsync(
      service.changePassword("username", "testPW", "newPW")
    ).not.toBeRejected();
  });
});
