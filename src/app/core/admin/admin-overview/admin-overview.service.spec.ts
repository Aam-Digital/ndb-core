import { TestBed } from "@angular/core/testing";

import { AdminOverviewService } from "./admin-overview.service";

describe("AdminOverviewService", () => {
  let service: AdminOverviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminOverviewService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
