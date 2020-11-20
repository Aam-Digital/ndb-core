import { TestBed } from "@angular/core/testing";

import { EntityConfig, EntityConfigService } from "./entity-config.service";
import { DatabaseEntity } from "./database-entity.decorator";
import { DatabaseField } from "./database-field.decorator";
import { Entity } from "./entity";
import { ConfigService } from "../config/config.service";

describe("EntityConfigService", () => {
  let service: EntityConfigService;
  const mockConfigService: jasmine.SpyObj<ConfigService> = jasmine.createSpyObj(
    "mockConfigService",
    ["getConfig"]
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    });
    service = TestBed.inject(EntityConfigService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add attributes to a entity class", () => {
    @DatabaseEntity("Test")
    class Test extends Entity {
      @DatabaseField() name: string;
    }

    expect(Test.schema.has("name")).toBeTrue();
    const testConfig = new EntityConfig();
    testConfig.attributes = [
      { name: "testAttribute", schema: { dataType: "string" } },
    ];
    mockConfigService.getConfig.and.returnValue(testConfig);
    service.addConfigAttributes<Test>(Test);
    expect(Test.schema.has("testAttribute")).toBeTrue();
    expect(Test.schema.has("name")).toBeTrue();
  });
});
