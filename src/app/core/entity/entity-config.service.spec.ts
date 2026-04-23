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
import { mockEntityMapperProvider } from "./entity-mapper/mock-entity-mapper-service";
import { EntityConfig } from "./entity-config";
import { EntitySchemaField } from "./schema/entity-schema-field";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { DefaultDatatype } from "./default-datatype/default.datatype";
import type { Mock } from "vitest";

type ConfigServiceMock = {
  getConfig: Mock;
  getAllConfigs: Mock;
};

class ForceArrayDatatype extends DefaultDatatype {
  static override readonly dataType = "force-array-test";

  override normalizeSchemaField(
    schemaField: EntitySchemaField,
  ): EntitySchemaField {
    return { ...schemaField, isArray: true };
  }
}

describe("EntityConfigService", () => {
  let service: EntityConfigService;
  let mockConfigService: ConfigServiceMock;
  const testConfig: EntityConfig = {
    attributes: { testAttribute: { dataType: "string" } },
  };

  beforeEach(() => {
    mockConfigService = {
      getConfig: vi.fn(),
      getAllConfigs: vi.fn(),
    };
    mockConfigService.getConfig.mockReturnValue(testConfig);
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        ...mockEntityMapperProvider(),
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        EntitySchemaService,
        {
          provide: DefaultDatatype,
          useClass: ForceArrayDatatype,
          multi: true,
        },
      ],
    });
    service = TestBed.inject(EntityConfigService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add attributes to a entity class schema", () => {
    expect(Test.schema.has("name")).toBe(true);
    service.addConfigAttributes<Test>(Test);
    expect(Test.schema.has("testAttribute")).toBe(true);
    expect(Test.schema.has("name")).toBe(true);
  });

  it("should assign the correct schema", () => {
    service.addConfigAttributes<Test>(Test);
    expect(Test.schema.get("testAttribute").dataType).toEqual("string");
  });

  it("should load a given EntityType", () => {
    const config: EntityConfig = {};
    mockConfigService.getConfig.mockReturnValue(config);
    const result = service.getEntityConfig(Test);
    expect(mockConfigService.getConfig).toHaveBeenCalledWith("entity:Test");
    expect(result).toBe(config);
  });

  it("appends custom definitions for each entity from the config", () => {
    const ATTRIBUTE_1_NAME = "test1Attribute";
    const ATTRIBUTE_2_NAME = "test2Attribute";
    const mockEntityConfigs: (EntityConfig & {
      _id: string;
    })[] = [
      {
        _id: "entity:Test",
        attributes: { [ATTRIBUTE_1_NAME]: { dataType: "string" } },
      },
      {
        _id: "entity:Test2",
        attributes: { [ATTRIBUTE_2_NAME]: { dataType: "number" } },
      },
    ];
    mockConfigService.getAllConfigs.mockReturnValue(mockEntityConfigs);
    service.setupEntitiesFromConfig();
    expect(Test.schema.has(ATTRIBUTE_1_NAME)).toBe(true);
    expect(Test2.schema.has(ATTRIBUTE_2_NAME)).toBe(true);
  });

  it("should reset attribute to basic class config if custom attribute disappears from config doc", () => {
    const originalLabel = TestEntity.schema.get("name").label;
    const customLabel = "custom label";

    const mockEntityConfigs: (EntityConfig & {
      _id: string;
    })[] = [
      {
        _id: "entity:" + TestEntity.ENTITY_TYPE,
        attributes: { name: { label: customLabel } },
      },
    ];
    mockConfigService.getAllConfigs.mockReturnValue(mockEntityConfigs);
    service.setupEntitiesFromConfig();
    expect(TestEntity.schema.get("name").label).toEqual(customLabel);

    mockConfigService.getAllConfigs.mockReturnValue([
      {
        _id: "entity:" + TestEntity.ENTITY_TYPE,
        attributes: {
          /* undo custom label */
        },
      },
    ]);
    service.setupEntitiesFromConfig();
    expect(TestEntity.schema.get("name").label).toEqual(originalLabel);
  });

  it("should allow to configure the `.toString` method", () => {
    mockConfigService.getAllConfigs.mockReturnValue([
      { _id: "entity:Test", toStringAttributes: ["name", "entityId"] },
    ]);
    service.setupEntitiesFromConfig();

    const test = new Test("id");
    test.name = "testName";
    expect(test.toString()).toBe("testName id");
  });

  it("should allow to configure the label and icon for entity", () => {
    mockConfigService.getAllConfigs.mockReturnValue([
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

  it("should allow to configure color as an array of ColorMappings for entity", () => {
    mockConfigService.getAllConfigs.mockReturnValue([
      {
        _id: "entity:Test",
        color: [
          { condition: { status: "active" }, color: "#00FF00" },
          { condition: { status: "inactive" }, color: "#FF0000" },
        ],
      },
    ]);
    service.setupEntitiesFromConfig();

    expect(Test.color).toBeDefined();
    expect(Array.isArray(Test.color)).toBe(true);
    if (!Array.isArray(Test.color)) {
      throw new Error("Expected Test.color to be an array");
    }
    expect(Test.color).toHaveLength(2);
    expect(Test.color[0].color).toBe("#00FF00");
    expect(Test.color[1].color).toBe("#FF0000");
  });

  it("should create a new subclass with the schema of the extended", () => {
    const schema: EntitySchemaField = {
      dataType: "string",
      label: "Dynamic Property",
    };
    mockConfigService.getAllConfigs.mockReturnValue([
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
      expect.arrayContaining([...Test.schema.entries()]),
    );
    expect(dynamicEntity.schema.get("dynamicProperty")).toEqual(schema);
    const dynamicInstance = new dynamicEntity("someId");
    expect(dynamicInstance instanceof Test).toBe(true);
    expect(dynamicInstance.getId()).toBe("DynamicTest:someId");

    // it should overwrite anything in the extended entity
    expect(Test.schema.has("dynamicProperty")).toBe(false);
    const parentInstance = new Test("otherId");
    expect(parentInstance.getId()).toBe("Test:otherId");
  });

  it("should subclass entity if no extension is specified", () => {
    mockConfigService.getAllConfigs.mockReturnValue([
      {
        _id: "entity:NoExtends",
        label: "DynamicTest",
        attributes: [],
      },
    ]);

    service.setupEntitiesFromConfig();

    const dynamicEntity = entityRegistry.get("NoExtends");

    // Logging schema differences for debugging test failures.
    // todo: remove these logs if the test passes reliably.
    console.log("Expected:", [...Entity.schema.entries()]);
    console.log("Received:", [...dynamicEntity.schema.entries()]);
    expect([...dynamicEntity.schema.entries()]).toEqual([
      ...Entity.schema.entries(),
    ]);
    const dynamicInstance = new dynamicEntity("someId");
    expect(dynamicInstance instanceof Entity).toBe(true);
    expect(dynamicInstance.getId()).toBe("NoExtends:someId");
  });

  it("should let datatypes normalize schema fields (e.g. force isArray)", () => {
    service.addConfigAttributes<Test>(Test, {
      attributes: {
        forcedArrayField: { dataType: "force-array-test" },
      },
    });

    const field = Test.schema.get("forcedArrayField");
    expect(field.isArray).toBe(true);
  });

  it("should return prefixed runtime route for config-based entity routes", () => {
    mockConfigService.getConfig.mockImplementation((id: string) => {
      if (id === "view:test") {
        return {
          component: "EntityList",
          config: { entityType: "Test" },
        };
      }
      return testConfig;
    });

    expect(service.getRuntimeRoute(Test)).toBe("/c/test");
    expect(service.getRuntimeDetailsRoutePath(Test)).toBe("c/test/:id");
  });

  it("should fall back to entity route when no list view config exists", () => {
    mockConfigService.getConfig.mockReturnValue(undefined);

    expect(service.getRuntimeRoute(Test)).toBe("/test");
    expect(service.getRuntimeDetailsRoutePath(Test)).toBe("test/:id");
  });
});

@DatabaseEntity("Test")
class Test extends Entity {
  @DatabaseField()
  name: string;
}

@DatabaseEntity("Test2")
class Test2 extends Entity {}
