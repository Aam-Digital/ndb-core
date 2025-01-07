import { TestBed } from "@angular/core/testing";

import { ConditionalFilterComponent } from "./conditional-filter.component";

describe("ConditionalFilterComponent", () => {
  let service: ConditionalFilterComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConditionalFilterComponent);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
