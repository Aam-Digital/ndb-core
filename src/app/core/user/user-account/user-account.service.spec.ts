import { TestBed } from "@angular/core/testing";

import { UserAccountService } from "./user-account.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { HttpClient } from "@angular/common/http";

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
});
