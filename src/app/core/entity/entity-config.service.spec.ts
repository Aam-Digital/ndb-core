import { TestBed } from "@angular/core/testing";

import { EntityConfigService } from "./entity-config.service";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "./database-entity.decorator";
import { DatabaseField } from "./database-field.decorator";
import { Entity } from "./model/entity";
import { ConfigService } from "../config/config.service";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "./entity-mapper/mock-entity-mapper-service";
import { EntityConfig } from "./entity-config";
import { EntitySchemaField } from "./schema/entity-schema-field";
import { Child } from "../../child-dev-project/children/model/child";

describe("EntityConfigService", () => {
  let service: EntityConfigService;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  const testConfig: EntityConfig = {
    attributes: { testAttribute: { dataType: "string" } },
  };

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getConfig", "getAllConfigs"]);
    mockConfigService.getConfig.and.returnValue(testConfig);
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        EntitySchemaService,
      ],
    });
    service = TestBed.inject(EntityConfigService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add attributes to a entity class schema", () => {
    expect(Test.schema).toHaveKey("name");
    service.addConfigAttributes<Test>(Test);
    expect(Test.schema).toHaveKey("testAttribute");
    expect(Test.schema).toHaveKey("name");
  });

  it("should assign the correct schema", () => {
    service.addConfigAttributes<Test>(Test);
    expect(Test.schema.get("testAttribute").dataType).toEqual("string");
  });

  it("should load a given EntityType", () => {
    const config: EntityConfig = {};
    mockConfigService.getConfig.and.returnValue(config);
    const result = service.getEntityConfig(Test);
    expect(mockConfigService.getConfig).toHaveBeenCalledWith("entity:Test");
    expect(result).toBe(config);
  });

  it("appends custom definitions for each entity from the config", () => {
    const ATTRIBUTE_1_NAME = "test1Attribute";
    const ATTRIBUTE_2_NAME = "test2Attribute";
    const mockEntityConfigs: (EntityConfig & { _id: string })[] = [
      {
        _id: "entity:Test",
        attributes: { [ATTRIBUTE_1_NAME]: { dataType: "string" } },
      },
      {
        _id: "entity:Test2",
        attributes: { [ATTRIBUTE_2_NAME]: { dataType: "number" } },
      },
    ];
    mockConfigService.getAllConfigs.and.returnValue(mockEntityConfigs);
    service.setupEntitiesFromConfig();
    expect(Test.schema).toHaveKey(ATTRIBUTE_1_NAME);
    expect(Test2.schema).toHaveKey(ATTRIBUTE_2_NAME);
  });

  it("should reset attribute to basic class config if custom attribute disappears from config doc", () => {
    const originalLabel = Child.schema.get("name").label;
    const customLabel = "custom label";

    const mockEntityConfigs: (EntityConfig & { _id: string })[] = [
      {
        _id: "entity:Child",
        attributes: { name: { label: customLabel } },
      },
    ];
    mockConfigService.getAllConfigs.and.returnValue(mockEntityConfigs);
    service.setupEntitiesFromConfig();
    expect(Child.schema.get("name").label).toEqual(customLabel);

    mockConfigService.getAllConfigs.and.returnValue([
      {
        _id: "entity:Child",
        attributes: {
          /* undo custom label */
        },
      },
    ]);
    service.setupEntitiesFromConfig();
    expect(Child.schema.get("name").label).toEqual(originalLabel);
  });

  it("should allow to configure the `.toString` method", () => {
    mockConfigService.getAllConfigs.and.returnValue([
      { _id: "entity:Test", toStringAttributes: ["name", "entityId"] },
    ]);
    service.setupEntitiesFromConfig();

    const test = new Test("id");
    test.name = "testName";
    expect(test.toString()).toBe("testName id");
  });

  it("should allow to configure the label and icon for entity", () => {
    mockConfigService.getAllConfigs.and.returnValue([
      {
        _id: "entity:Test",
        label: "test",
        labelPlural: "tests",
        icon: "users",
        color: "red",
      },
    ]);
    service.setupEntitiesFromConfig();

    expect(Test.label).toBe("test");
    expect(Test.labelPlural).toBe("tests");
    expect(Test.icon).toBe("users");
    expect(Test.color).toBe("red");
  });

  it("should create a new subclass with the schema of the extended", () => {
    const schema: EntitySchemaField = {
      dataType: "string",
      label: "Dynamic Property",
    };
    mockConfigService.getAllConfigs.and.returnValue([
      {
        _id: "entity:DynamicTest",
        label: "Dynamic Test Entity",
        extends: "Test",
        attributes: { dynamicProperty: schema },
      } as EntityConfig,
    ]);

    service.setupEntitiesFromConfig();

    const dynamicEntity = entityRegistry.get("DynamicTest");
    expect(dynamicEntity.ENTITY_TYPE).toBe("DynamicTest");
    expect([...dynamicEntity.schema.entries()]).toEqual(
      jasmine.arrayContaining([...Test.schema.entries()]),
    );
    expect(dynamicEntity.schema.get("dynamicProperty")).toEqual(schema);
    const dynamicInstance = new dynamicEntity("someId");
    expect(dynamicInstance instanceof Test).toBeTrue();
    expect(dynamicInstance.getId()).toBe("DynamicTest:someId");

    // it should overwrite anything in the extended entity
    expect(Test.schema.has("dynamicProperty")).toBeFalse();
    const parentInstance = new Test("otherId");
    expect(parentInstance.getId()).toBe("Test:otherId");
  });

  it("should subclass entity if no extension is specified", () => {
    mockConfigService.getAllConfigs.and.returnValue([
      {
        _id: "entity:NoExtends",
        label: "DynamicTest",
        attributes: [],
      },
    ]);

    service.setupEntitiesFromConfig();

    const dynamicEntity = entityRegistry.get("NoExtends");
    expect([...dynamicEntity.schema.entries()]).toEqual([
      ...Entity.schema.entries(),
    ]);
    const dynamicInstance = new dynamicEntity("someId");
    expect(dynamicInstance instanceof Entity).toBeTrue();
    expect(dynamicInstance.getId()).toBe("NoExtends:someId");
  });
});

@DatabaseEntity("Test")
class Test extends Entity {
  @DatabaseField() name: string;
}

@DatabaseEntity("Test2")
class Test2 extends Entity {}
