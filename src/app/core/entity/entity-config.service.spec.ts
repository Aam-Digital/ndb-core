import { TestBed } from "@angular/core/testing";

import { EntityConfig, EntityConfigService } from "./entity-config.service";
import {
  DatabaseEntity,
  EntityRegistry,
  entityRegistry,
} from "./database-entity.decorator";
import { DatabaseField } from "./database-field.decorator";
import { Entity } from "./model/entity";
import { ConfigService } from "../config/config.service";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { EntityMapperService } from "./entity-mapper.service";
import { mockEntityMapper } from "./mock-entity-mapper-service";

describe("EntityConfigService", () => {
  let service: EntityConfigService;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  const testConfig: EntityConfig = {
    attributes: [{ name: "testAttribute", schema: { dataType: "string" } }],
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
    const config: EntityConfig = { attributes: [] };
    mockConfigService.getConfig.and.returnValue(config);
    const result = service.getEntityConfig(Test);
    expect(mockConfigService.getConfig).toHaveBeenCalledWith("entity:Test");
    expect(result).toBe(config);
  });

  it("throws an error when trying to setting the entities up from config and they are not registered", () => {
    const configWithInvalidEntities: (EntityConfig & { _id: string })[] = [
      {
        _id: "entity:IDoNotExist",
        attributes: [],
      },
    ];
    mockConfigService.getAllConfigs.and.returnValue(configWithInvalidEntities);

    expect(() => service.setupEntitiesFromConfig()).toThrowError();
  });

  it("appends custom definitions for each entity from the config", () => {
    const ATTRIBUTE_1_NAME = "test1Attribute";
    const ATTRIBUTE_2_NAME = "test2Attribute";
    const mockEntityConfigs: (EntityConfig & { _id: string })[] = [
      {
        _id: "entity:Test",
        attributes: [
          {
            name: ATTRIBUTE_1_NAME,
            schema: {
              dataType: "string",
            },
          },
        ],
      },
      {
        _id: "entity:Test2",
        attributes: [
          {
            name: ATTRIBUTE_2_NAME,
            schema: {
              dataType: "number",
            },
          },
        ],
      },
    ];
    mockConfigService.getAllConfigs.and.returnValue(mockEntityConfigs);
    service.setupEntitiesFromConfig();
    expect(Test.schema).toHaveKey(ATTRIBUTE_1_NAME);
    expect(Test2.schema).toHaveKey(ATTRIBUTE_2_NAME);
  });
});

@DatabaseEntity("Test")
class Test extends Entity {
  @DatabaseField() name: string;
}

@DatabaseEntity("Test2")
class Test2 extends Entity {}
