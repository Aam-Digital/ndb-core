import { TestBed } from "@angular/core/testing";

import { EntityRemoveService } from "./entity-remove.service";

describe("EntityRemoveService", () => {
  let service: EntityRemoveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityRemoveService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
