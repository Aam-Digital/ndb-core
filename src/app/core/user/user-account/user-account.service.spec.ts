import { TestBed } from "@angular/core/testing";

import { UserAccountService } from "./user-account.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { HttpClient } from "@angular/common/http";
import { User } from "../user";
import { of } from "rxjs";

describe("UserAccountService", () => {
  let service: UserAccountService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj("mockEntityMapper", ["save"]);
    mockHttpClient = jasmine.createSpyObj("mockHttpClient", ["get", "put"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });
    service = TestBed.inject(UserAccountService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call report error when CouchDB not available", (done) => {
    const user = new User("TestUser");
    user.setNewPassword("testPW");
    mockHttpClient.get.and.throwError(new Error("error"));
    service
      .changePassword(user, "testPW", "")
      .then(() => fail())
      .catch((err) => {
        expect(mockHttpClient.get).toHaveBeenCalled();
        expect(err).toBeDefined();
        done();
      });
  });

  it("should call report error when new Password cannot be saved", (done) => {
    const user = new User("TestUser");
    user.setNewPassword("testPW");
    mockHttpClient.get.and.returnValues(of({}));
    mockHttpClient.put.and.throwError(new Error("error"));
    service
      .changePassword(user, "testPW", "")
      .then(() => fail())
      .catch((err) => {
        expect(mockHttpClient.get).toHaveBeenCalled();
        expect(mockHttpClient.put).toHaveBeenCalled();
        expect(err).toBeDefined();
        done();
      });
  });

  it("should return User with new password", (done) => {
    const user = new User("TestUser");
    user.setNewPassword("testPW");
    mockHttpClient.get.and.returnValues(of({}));
    mockHttpClient.put.and.returnValues(of({}));
    mockEntityMapper.save.and.resolveTo(true);
    service.changePassword(user, "testPW", "newPW").then((res) => {
      expect(res.checkPassword("testPW")).toBeFalse();
      expect(res.checkPassword("newPW")).toBeTrue();
      done();
    });
  });
});
