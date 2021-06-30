import { TestBed } from "@angular/core/testing";

import { EntityConfig, EntityConfigService } from "./entity-config.service";
import { DatabaseEntity } from "./database-entity.decorator";
import { DatabaseField } from "./database-field.decorator";
import { Entity } from "./model/entity";
import { ConfigService } from "../config/config.service";

describe("EntityConfigService", () => {
  let service: EntityConfigService;
  const mockConfigService: jasmine.SpyObj<ConfigService> = jasmine.createSpyObj(
    "mockConfigService",
    ["getConfig"]
  );
  const testConfig: EntityConfig = {
    attributes: [{ name: "testAttribute", schema: { dataType: "string" } }],
  };

  beforeEach(() => {
    mockConfigService.getConfig.and.returnValue(testConfig);
    TestBed.configureTestingModule({
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    });
    service = TestBed.inject(EntityConfigService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add attributes to a entity class schema", () => {
    expect(Test.schema.has("name")).toBeTrue();
    service.addConfigAttributes<Test>(Test);
    expect(Test.schema.has("testAttribute")).toBeTrue();
    expect(Test.schema.has("name")).toBeTrue();
  });

  it("should assign the correct schema", () => {
    service.addConfigAttributes<Test>(Test);
    expect(Test.schema.get("testAttribute").dataType).toEqual("string");
  });

  it("should load a given EntityType", () => {
    const config: EntityConfig = { permissions: {}, attributes: [] };
    mockConfigService.getConfig.and.returnValue(config);
    const result = service.getEntityConfig(Test);
    expect(mockConfigService.getConfig).toHaveBeenCalledWith("entity:Test");
    expect(result).toBe(config);
  });
});

@DatabaseEntity("Test")
class Test extends Entity {
  @DatabaseField() name: string;
}
