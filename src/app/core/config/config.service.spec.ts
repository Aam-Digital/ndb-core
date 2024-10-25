import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Config } from "./config";
import { firstValueFrom, Subject } from "rxjs";
import { UpdatedEntity } from "../entity/model/entity-update";
import { EntityConfig } from "../entity/entity-config";

describe("ConfigService", () => {
  let service: ConfigService;
  let entityMapper: jasmine.SpyObj<EntityMapperService>;
  const updateSubject = new Subject<UpdatedEntity<Config>>();

  beforeEach(waitForAsync(() => {
    entityMapper = jasmine.createSpyObj(["load", "save", "receiveUpdates"]);
    entityMapper.receiveUpdates.and.returnValue(updateSubject);
    entityMapper.load.and.rejectWith();
    entityMapper.save.and.resolveTo([]);
    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    });
    service = TestBed.inject(ConfigService);
  }));

  /**
   * Check that config is migrated as expected (and doesn't destroy new config)
   * @param oldFormat Config.data object to test
   * @param expectedNewFormat Config.data object expected after migration
   */
  function testConfigMigration(oldFormat: Object, expectedNewFormat: Object) {
    const config = new Config();

    config.data = JSON.parse(JSON.stringify(oldFormat));
    updateSubject.next({ entity: config, type: "update" });
    tick();
    expectConfigToMatch(expectedNewFormat);

    config.data = JSON.parse(JSON.stringify(expectedNewFormat));
    updateSubject.next({ entity: config, type: "update" });
    tick();
    expectConfigToMatch(expectedNewFormat);

    function expectConfigToMatch(expectedConfigData: Object) {
      for (const [configKey, configNewValue] of Object.entries(
        expectedConfigData,
      )) {
        const actualFromOld = service.getConfig(configKey);
        expect(actualFromOld).toEqual(configNewValue);
      }
    }
  }

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load the config from the entity mapper", fakeAsync(() => {
    const testConfig = new Config();
    testConfig.data = { testKey: "testValue" };
    entityMapper.load.and.resolveTo(testConfig);

    service.loadOnce();
    expect(entityMapper.load).toHaveBeenCalled();
    tick();
    expect(service.getConfig("testKey")).toEqual("testValue");
  }));

  it("should emit the config once it is loaded", fakeAsync(() => {
    entityMapper.load.and.rejectWith("No config found");
    const configLoaded = firstValueFrom(service.configUpdates);

    service.loadOnce();
    tick();
    expect(() => service.getConfig("testKey")).toThrowError();

    const testConfig = new Config();
    testConfig.data = { testKey: "testValue" };
    updateSubject.next({ type: "new", entity: testConfig });
    tick();

    expect(service.getConfig("testKey")).toBe("testValue");
    return expectAsync(configLoaded).toBeResolvedTo(testConfig);
  }));

  it("should correctly return prefixed fields", fakeAsync(() => {
    const testConfig = new Config();
    testConfig.data = {
      "test:1": { name: "first" },
      "other:1": { name: "wrong" },
      "test:2": { name: "second" },
    };
    entityMapper.load.and.resolveTo(testConfig);
    service.loadOnce();
    tick();
    const result = service.getAllConfigs<any>("test:");
    expect(result).toHaveSize(2);
    expect(result).toContain({ name: "first", _id: "test:1" });
    expect(result).toContain({ name: "second", _id: "test:2" });
    expect(result).not.toContain({ name: "wrong", _id: "other:1" });
  }));

  it("should return single field", fakeAsync(() => {
    const testConfig = new Config();
    testConfig.data = { first: "correct", second: "wrong" };
    entityMapper.load.and.resolveTo(testConfig);
    service.loadOnce();
    tick();
    const result = service.getConfig<any>("first");
    expect(result).toBe("correct");
  }));

  it("should save a new config", () => {
    const newConfig = { test: "data" };
    service.saveConfig(newConfig);
    expect(entityMapper.save).toHaveBeenCalled();
    const lastCall = entityMapper.save.calls.mostRecent().args[0] as Config;
    expect(lastCall).toBeInstanceOf(Config);
    expect(lastCall.data).toEqual({ test: "data" });
  });

  it("should create export config string", fakeAsync(() => {
    const config = new Config();
    config.data = { first: "foo", second: "bar" };
    // @ts-ignore disable migrations for this test
    spyOn(service, "applyMigrations").and.callFake((c) => c);

    const expected = JSON.stringify(config.data);
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const result = service.exportConfig();
    expect(result).toEqual(expected);
  }));

  describe("should migrate EntitySchemaField.defaultValue", () => {
    it("should not migrate defaultValue matching the new format", fakeAsync(() => {
      let testEntity = "entity:old-format";

      updateSubject.next({
        entity: Object.assign(new Config(), {
          data: {
            [testEntity]: {
              attributes: {
                fieldName: {
                  defaultValue: {
                    mode: "static",
                    value: 3,
                  },
                },
              },
            },
          },
        }),
        type: "update",
      });
      tick();

      const expectedEntityAttributes = {
        mode: "static",
        value: 3,
      };

      const config = service.getConfig(testEntity);
      expect(config["attributes"].fieldName.defaultValue).toEqual(
        expectedEntityAttributes,
      );
    }));

    it("should migrate defaultValue with number value", fakeAsync(() => {
      let testEntity = "entity:old-format";

      updateSubject.next({
        entity: Object.assign(new Config(), {
          data: {
            [testEntity]: {
              attributes: {
                fieldName: {
                  defaultValue: 3,
                },
              },
            },
          },
        }),
        type: "update",
      });
      tick();

      const expectedEntityAttributes = {
        mode: "static",
        value: 3,
      };

      const config = service.getConfig(testEntity);
      expect(config["attributes"].fieldName.defaultValue).toEqual(
        expectedEntityAttributes,
      );
    }));

    it("should migrate defaultValue with string value", fakeAsync(() => {
      let testEntity = "entity:old-format";

      updateSubject.next({
        entity: Object.assign(new Config(), {
          data: {
            [testEntity]: {
              attributes: {
                fieldName: {
                  defaultValue: "foo",
                },
              },
            },
          },
        }),
        type: "update",
      });
      tick();

      const expectedEntityAttributes = {
        mode: "static",
        value: "foo",
      };

      const config = service.getConfig(testEntity);
      expect(config["attributes"].fieldName.defaultValue).toEqual(
        expectedEntityAttributes,
      );
    }));

    it("should migrate defaultValue with placeholder value", fakeAsync(() => {
      let testEntity = "entity:old-format";

      updateSubject.next({
        entity: Object.assign(new Config(), {
          data: {
            [testEntity]: {
              attributes: {
                fieldName: {
                  defaultValue: "$now",
                },
              },
            },
          },
        }),
        type: "update",
      });
      tick();

      const expectedEntityAttributes = {
        mode: "dynamic",
        value: "$now",
      };

      const config = service.getConfig(testEntity);
      expect(config["attributes"].fieldName.defaultValue).toEqual(
        expectedEntityAttributes,
      );
    }));
  });

  it("should migrate entity-array dataType", fakeAsync(() => {
    const config = new Config();
    const oldFormat = {
      attributes: {
        entityarray_update: {
          dataType: "entity-array",
        },
        array_update: {
          dataType: "array",
          innerDataType: "entity",
        },
        array_update2: {
          dataType: "array",
          innerDataType: "configurable-enum",
          additional: "foo-enum",
        },
        enum_additional_update: {
          dataType: "configurable-enum",
          innerDataType: "foo-enum",
        },
        keep1: {
          dataType: "entity",
        },
        keep2: {
          dataType: "entity",
          isArray: true,
        },
      },
    };
    const newFormat: EntityConfig = {
      attributes: {
        entityarray_update: {
          dataType: "entity",
          isArray: true,
        },
        array_update: {
          dataType: "entity",
          isArray: true,
        },
        array_update2: {
          dataType: "configurable-enum",
          isArray: true,
          additional: "foo-enum",
        },
        enum_additional_update: {
          dataType: "configurable-enum",
          additional: "foo-enum",
        },
        keep1: {
          dataType: "entity",
        },
        keep2: {
          dataType: "entity",
          isArray: true,
        },
      },
    };
    config.data = { "entity:X": oldFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();

    const actualFromOld = service.getConfig<EntityConfig>("entity:X");
    expect(actualFromOld).toEqual(newFormat);

    config.data = { "entity:X": newFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const actualFromNew = service.getConfig<EntityConfig>("entity:X");
    expect(actualFromNew).toEqual(newFormat);
  }));

  it("should migrate ChildrenList", fakeAsync(() => {
    const oldFormat = {
      component: "ChildrenList",
      config: {},
    };
    const newFormat = {
      component: "EntityList",
      config: {
        entityType: "Child",
        loaderMethod: "ChildrenService",
      },
    };

    testConfigMigration({ "view:X": oldFormat }, { "view:X": newFormat });
  }));

  it("should migrate to new photo dataType", fakeAsync(() => {
    const config = new Config();
    const oldFormat = {
      attributes: {
        myPhoto: {
          dataType: "file",
          editComponent: "EditPhoto",
          label: "My Photo",
        },
        simpleFile: {
          dataType: "file",
          label: "Simple File attachment",
        },
      },
    };

    const newFormat: EntityConfig = {
      attributes: {
        myPhoto: {
          dataType: "photo",
          label: "My Photo",
        },
        simpleFile: {
          dataType: "file",
          label: "Simple File attachment",
        },
      },
    };

    config.data = { "entity:X": oldFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const actualFromOld = service.getConfig<EntityConfig>("entity:X");
    expect(actualFromOld).toEqual(newFormat);

    config.data = { "entity:X": newFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const actualFromNew = service.getConfig<EntityConfig>("entity:X");
    expect(actualFromNew).toEqual(newFormat);
  }));

  it("should migrate to Percentage dataType", fakeAsync(() => {
    const config = new Config();
    const oldFormat = {
      attributes: {
        myPercentage: {
          dataType: "number",
          viewComponent: "DisplayPercentage",
          editComponent: "EditNumber",
          label: "My Percentage",
        },
        simpleNumber: {
          dataType: "number",
          label: "Simple Number",
        },
      },
    };

    const newFormat: EntityConfig = {
      attributes: {
        myPercentage: {
          dataType: "percentage",
          label: "My Percentage",
        },
        simpleNumber: {
          dataType: "number",
          label: "Simple Number",
        },
      },
    };

    config.data = { "entity:X": oldFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const actualFromOld = service.getConfig<EntityConfig>("entity:X");
    expect(actualFromOld).toEqual(newFormat);

    config.data = { "entity:X": newFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const actualFromNew = service.getConfig<EntityConfig>("entity:X");
    expect(actualFromNew).toEqual(newFormat);
  }));

  it("should migrate ChildBlock config", fakeAsync(() => {
    testConfigMigration(
      {
        "entity:ChildX": {
          label: "ChildX",
          blockComponent: "ChildBlock",
        },
      },
      {
        "entity:ChildX": {
          label: "ChildX",
          toBlockDetailsAttributes: {
            title: "name",
            photo: "photo",
            fields: ["phone", "schoolId", "schoolClass"],
          },
        },
      },
    );
  }));

  it("should wrap groupBy as an array if it is a string", fakeAsync(() => {
    const oldConfig = {
      component: "EntityCountDashboard",
      config: {
        entityType: "Child",
        groupBy: "center", // groupBy is a string
      },
    };

    const expectedNewConfig = {
      component: "EntityCountDashboard",
      config: {
        entityType: "Child",
        groupBy: ["center"], // groupBy should be wrapped as an array
      },
    };

    testConfigMigration(oldConfig, expectedNewConfig);

    // should not change other configs that have a groupBy property
    const otherConfig = {
      "view:X": {
        config: {
          columns: {
            groupBy: "foo",
          },
        },
      },
    };
    testConfigMigration(otherConfig, otherConfig);
  }));
});
