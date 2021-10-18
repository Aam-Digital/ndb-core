import { EntityMapperService } from "./entity-mapper.service";
import { TestBed } from "@angular/core/testing";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { DynamicEntityService } from "./dynamic-entity.service";
import { DatabaseEntity } from "./database-entity.decorator";
import { Entity } from "./model/entity";
import { DatabaseField } from "./database-field.decorator";

describe("DynamicEntityService", () => {
  let service: DynamicEntityService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["load", "loadType"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
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
    DynamicEntityService.registerNewEntity(mockEntityName, TestEntity3);
    expect(service.isRegisteredEntity(mockEntityName)).toBeTrue();
  });

  it("contains entity-definitions when they have the 'DatabaseEntity' decorator", () => {
    expect(service.isRegisteredEntity(TEST_ENTITY_1_TYPE)).toBeTrue();
  });

  it("warns when trying to define a duplicate entity", () => {
    const logMock = spyOn(console, "warn");
    DynamicEntityService.registerNewEntity(TEST_ENTITY_1_TYPE, TestEntity1);
    expect(logMock).toHaveBeenCalled();
  });

  it("returns the entity-constructor of a defined entity", () => {
    const ctor = service.getEntityConstructor(TEST_ENTITY_1_TYPE);
    expect(ctor).toEqual(TestEntity1);
  });

  it("throws when trying to get an entity-constructor that doesn't exist", () => {
    expect(() => service.getEntityConstructor("IDoNotExist")).toThrowError();
  });

  it("Instantiates an entity", () => {
    const instance = service.instantiateEntity(TEST_ENTITY_2_TYPE);
    expect(instance.getType()).toEqual(TEST_ENTITY_2_TYPE);
    expect(instance).toBeInstanceOf(Entity);
  });

  it("Instantiates an entity with given id", () => {
    const idName = "id";
    const instance = service.instantiateEntity(TEST_ENTITY_2_TYPE, idName);
    expect(instance.getId()).toEqual(idName);
    expect(instance.getType()).toEqual(TEST_ENTITY_2_TYPE);
  });

  it("instantiates an entity with given initial raw parameters", () => {
    const idName = "id";
    const params = {
      x: "Hello, World!",
      y: 42,
    };
    const instance = service.instantiateEntity<TestEntity2>(
      TEST_ENTITY_2_TYPE,
      idName,
      params
    );
    expect(instance.x).toEqual(params.x);
    expect(instance.y).toEqual(params.y);
  });

  it("returns true when any entity is registered from a set of given types", () => {
    expect(
      service.hasAnyRegisteredEntity(TEST_ENTITY_1_TYPE, "IDoNotExist")
    ).toBeTrue();
  });

  it("returns false when no entity is registered from a set of given types", () => {
    expect(
      service.hasAnyRegisteredEntity("IDoNotExist", "MeNeither")
    ).toBeFalse();
  });

  it("loads an entity by it's type", () => {
    const entityId = "id";
    const mockEntity = new TestEntity2(entityId);
    mockEntity.x = "Hello, World!";
    mockEntity.y = 42;
    mockEntityMapper.load.and.callFake((type, id) => {
      if (type === TestEntity2 && id === entityId) {
        return Promise.resolve(mockEntity as any);
      } else {
        return Promise.reject();
      }
    });
    const entity = service.loadEntity(TEST_ENTITY_2_TYPE, entityId);
    return expectAsync(entity).toBeResolvedTo(mockEntity);
  });

  it("loads an array of entities by their type", () => {
    const mockEntities = ["id1", "id2"].map((id) => new TestEntity2(id));
    mockEntityMapper.loadType.and.callFake((type) => {
      if (type === TestEntity2) {
        return Promise.resolve(mockEntities as any);
      } else {
        return Promise.reject();
      }
    });
    const entities = service.loadType(TEST_ENTITY_2_TYPE);
    return expectAsync(entities).toBeResolvedTo(mockEntities);
  });
});

const TEST_ENTITY_1_TYPE = "TestEntity1";

@DatabaseEntity(TEST_ENTITY_1_TYPE)
class TestEntity1 extends Entity {}

const TEST_ENTITY_2_TYPE = "TestEntity2";

@DatabaseEntity(TEST_ENTITY_2_TYPE)
class TestEntity2 extends Entity {
  @DatabaseField()
  x?: string;

  @DatabaseField()
  y?: number;
}

class TestEntity3 extends Entity {}
