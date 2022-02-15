import { EntityMapperService } from "./entity-mapper.service";
import { TestBed } from "@angular/core/testing";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { DynamicEntityService } from "./dynamic-entity.service";
import { DatabaseEntity } from "./database-entity.decorator";
import { Entity } from "./model/entity";
import { DatabaseField } from "./database-field.decorator";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";
import { ENTITIES, entityRegistry } from "../registry/dynamic-registry";

describe("DynamicEntityService", () => {
  let service: DynamicEntityService;
  let mockedEntityMapper: MockEntityMapperService;

  beforeEach(() => {
    mockedEntityMapper = mockEntityMapper();
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        {
          provide: ENTITIES,
          useValue: entityRegistry,
        },
        EntitySchemaService,
      ],
    });
    service = TestBed.inject(DynamicEntityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // TODO: How to proceed with this service?
});

const ENTITY_WITH_DECORATOR_TYPE = "EntityWithDecorator";

@DatabaseEntity(ENTITY_WITH_DECORATOR_TYPE)
class EntityWithDecorator extends Entity {}

const ENTITY_WITH_PARAMETERS_TYPE = "EntityWithParameters";

@DatabaseEntity(ENTITY_WITH_PARAMETERS_TYPE)
class EntityWithParameters extends Entity {
  @DatabaseField()
  x?: string;

  @DatabaseField()
  y?: number;
}

class EntityWithoutDecorator extends Entity {}

const NON_ENTITY_CLASS_TYPE = "NonEntityClass";

class NonEntityClass {}
