import { TestBed } from "@angular/core/testing";

import { StaticDefaultValueService } from "./static-default-value.service";

describe("StaticDefaultValueService", () => {
  let service: StaticDefaultValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [],
    });
    service = TestBed.inject(StaticDefaultValueService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
