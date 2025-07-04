import { TestBed } from "@angular/core/testing";

import { AdminEntityService } from "./admin-entity.service";
import { mockEntityMapperProvider } from "../entity/entity-mapper/mock-entity-mapper-service";

describe("AdminEntityService", () => {
  let service: AdminEntityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...mockEntityMapperProvider()],
    });
    service = TestBed.inject(AdminEntityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // saving tested via AdminEntityComponent (see admin-entity.component.spec.ts)
});
