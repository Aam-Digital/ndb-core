import { EntityMapperService } from "./entity-mapper.service";
import { TestBed } from "@angular/core/testing";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { DynamicEntityService } from "./dynamic-entity.service";
import { DatabaseEntity } from "./database-entity.decorator";
import { Entity, EntityConstructor } from "./model/entity";
import { DatabaseField } from "./database-field.decorator";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";

describe("DynamicEntityService", () => {
  let service: DynamicEntityService;
  let mockedEntityMapper: MockEntityMapperService;

  beforeEach(() => {
    mockedEntityMapper = mockEntityMapper();
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockedEntityMapper },
        EntitySchemaService,
      ],
    });
    service = TestBed.inject(DynamicEntityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("contains the new entity-definition when registered", () => {
    const mockEntityName = "Mock";
    DynamicEntityService.registerNewEntity(
      mockEntityName,
      EntityWithoutDecorator
    );
    expect(service.isRegisteredEntity(mockEntityName)).toBeTrue();
  });

  it("contains entity-definitions when they have the 'DatabaseEntity' decorator", () => {
    expect(service.isRegisteredEntity(ENTITY_WITH_DECORATOR_TYPE)).toBeTrue();
  });

  it("throws when trying to define a duplicate entity", () => {
    const registerNewEntity = () => {
      DynamicEntityService.registerNewEntity(
        ENTITY_WITH_DECORATOR_TYPE,
        EntityWithDecorator
      );
    };
    expect(registerNewEntity).toThrowError();
  });

  it("throws when trying to set a constructor that is not an entity-constructor", () => {
    const registerNonEntity = () => {
      DynamicEntityService.registerNewEntity(
        NON_ENTITY_CLASS_TYPE,
        NonEntityClass as EntityConstructor<Entity>
      );
    };
    expect(registerNonEntity).toThrowError();
  });

  it("returns the entity-constructor of a defined entity", () => {
    const ctor = service.getEntityConstructor(ENTITY_WITH_DECORATOR_TYPE);
    expect(ctor).toEqual(EntityWithDecorator);
  });

  it("throws when trying to get an entity-constructor that doesn't exist", () => {
    expect(() => service.getEntityConstructor("IDoNotExist")).toThrowError();
  });

  it("Instantiates an entity", () => {
    const instance = service.instantiateEntity(ENTITY_WITH_PARAMETERS_TYPE);
    expect(instance.getType()).toEqual(ENTITY_WITH_PARAMETERS_TYPE);
    expect(instance).toBeInstanceOf(Entity);
    expect(instance).toBeInstanceOf(EntityWithParameters);
  });

  it("Instantiates an entity with given id", () => {
    const idName = "id";
    const instance = service.instantiateEntity(
      ENTITY_WITH_PARAMETERS_TYPE,
      idName
    );
    expect(instance.getId()).toEqual(idName);
    expect(instance.getType()).toEqual(ENTITY_WITH_PARAMETERS_TYPE);
  });

  it("instantiates an entity with given initial raw parameters", () => {
    const idName = "id";
    const params = {
      x: "Hello, World!",
      y: 42,
    };
    const instance = service.instantiateEntity<EntityWithParameters>(
      ENTITY_WITH_PARAMETERS_TYPE,
      idName,
      params
    );
    expect(instance.x).toEqual(params.x);
    expect(instance.y).toEqual(params.y);
  });

  it("returns true when any entity is registered from a set of given types", () => {
    expect(
      service.hasAnyRegisteredEntity(ENTITY_WITH_DECORATOR_TYPE, "IDoNotExist")
    ).toBeTrue();
  });

  it("returns false when no entity is registered from a set of given types", () => {
    expect(
      service.hasAnyRegisteredEntity("IDoNotExist", "MeNeither")
    ).toBeFalse();
  });

  it("loads an entity by it's type", () => {
    const entityId = "id";
    const mockEntity = new EntityWithParameters(entityId);
    mockEntity.x = "Hello, World!";
    mockEntity.y = 42;
    mockedEntityMapper.add(mockEntity);
    const entity = service.loadEntity(ENTITY_WITH_PARAMETERS_TYPE, entityId);
    return expectAsync(entity).toBeResolvedTo(mockEntity);
  });

  it("loads an array of entities by their type", () => {
    const mockEntities = ["id1", "id2"].map(
      (id) => new EntityWithParameters(id)
    );
    mockedEntityMapper.addAll(mockEntities);
    const entities = service.loadType(ENTITY_WITH_PARAMETERS_TYPE);
    return expectAsync(entities).toBeResolvedTo(mockEntities);
  });
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
