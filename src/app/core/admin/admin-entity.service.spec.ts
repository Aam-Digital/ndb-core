import { TestBed } from "@angular/core/testing";

import { AdminEntityService } from "./admin-entity.service";

describe("AdminEntityService", () => {
  let service: AdminEntityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminEntityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
