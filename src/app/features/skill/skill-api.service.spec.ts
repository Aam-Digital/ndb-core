import { TestBed } from "@angular/core/testing";

import { SkillApiService } from "./skill-api.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";

describe("SkillApiService", () => {
  let service: SkillApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: EntityRegistry, useValue: new EntityRegistry() },
      ],
    });
    service = TestBed.inject(SkillApiService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
