import { TestBed } from "@angular/core/testing";

import { QuickActionService } from "./quick-action.service";

describe("QuickActionService", () => {
  let service: QuickActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuickActionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
