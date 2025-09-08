import { TestBed } from "@angular/core/testing";

import { AdminEntityService } from "./admin-entity.service";
import { mockEntityMapperProvider } from "../entity/entity-mapper/mock-entity-mapper-service";
import {
  entityRegistry,
  EntityRegistry,
} from "../entity/database-entity.decorator";
import { EntityConfigService } from "../entity/entity-config.service";

describe("AdminEntityService", () => {
  let service: AdminEntityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...mockEntityMapperProvider(),
        {
          provide: EntityRegistry,
          useValue: { entityRegistry },
        },
      ],
    });
    service = TestBed.inject(AdminEntityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create and return empty object if entity config key is missing", async () => {
    const config: any = { data: {} };
    const entityConstructor: any = { ENTITY_TYPE: "NewTestEntity" };
    const result = await (service as any).getEntitySchemaFromConfig(
      config,
      entityConstructor,
    );
    const entityConfigKey =
      EntityConfigService.PREFIX_ENTITY_CONFIG + entityConstructor.ENTITY_TYPE;

    expect(result).toEqual({});
    expect(config.data[entityConfigKey]).toBe(result);
  });

  // saving tested via AdminEntityComponent (see admin-entity.component.spec.ts)
});
