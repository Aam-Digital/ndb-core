import { TestBed } from "@angular/core/testing";

import { EntityDuplicatesService } from "./entity-duplicates.service";

describe("EntityDuplicatesService", () => {
  let service: EntityDuplicatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityDuplicatesService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
