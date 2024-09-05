import { TestBed } from "@angular/core/testing";

import { EntityActionsMenuService } from "./entity-actions-menu.service";

describe("EntityActionsMenuService", () => {
  let service: EntityActionsMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityActionsMenuService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
