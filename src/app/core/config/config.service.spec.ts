import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Config } from "./config";
import { firstValueFrom, Subject } from "rxjs";
import { UpdatedEntity } from "../entity/model/entity-update";
import { EntityConfig } from "../entity/entity-config";
import { FieldGroup } from "../entity-details/form/field-group";
import { NavigationMenuConfig } from "../ui/navigation/menu-item";

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
    const expected = JSON.stringify(config.data);
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const result = service.exportConfig();
    expect(result).toEqual(expected);
  }));

  it("should migrate entity attributes config to flattened object format with id", fakeAsync(() => {
    const config = new Config();
    config.data = {
      "entity:old-format": {
        attributes: [
          {
            name: "count",
            schema: {
              dataType: "number",
            },
          },
        ],
      },
      "entity:new-format": {
        attributes: {
          count: {
            dataType: "number",
          },
        },
      },
    };
    updateSubject.next({ entity: config, type: "update" });
    tick();

    const expectedEntityAttributes = {
      count: { dataType: "number" },
    };

    const actualFromOld = service.getConfig<EntityConfig>("entity:old-format");
    expect(actualFromOld.attributes).toEqual(expectedEntityAttributes);

    const actualFromNew = service.getConfig<EntityConfig>("entity:new-format");
    expect(actualFromNew.attributes).toEqual(expectedEntityAttributes);
  }));

  it("should migrate Form field group headers into combined format", fakeAsync(() => {
    const testConfigId = "view:test/:id";

    const form1Config = {
      cols: [["name"], ["other"]],
      headers: [null, "2nd group"],
    };
    const form2Config = {
      cols: [["name"], ["other"]],
    };
    const formNewConfig = {
      fieldGroups: [
        { fields: ["name"] } as FieldGroup,
        { fields: ["name"] } as FieldGroup,
      ],
    };

    const viewConfig = {
      component: "EntityDetails",
      config: {
        entity: "Entity",
        panels: [
          {
            title: "Tab 1",
            components: [{ title: "", component: "Form", config: form1Config }],
          },
          {
            title: "Tab 2",
            components: [
              { component: "ActivitiesOverview" },
              { component: "Form", config: form2Config },
            ],
          },
          {
            title: "Tab with new config",
            components: [{ component: "Form", config: formNewConfig }],
          },
        ],
      },
    };

    updateSubject.next({
      entity: Object.assign(new Config(), {
        data: { [testConfigId]: viewConfig },
      }),
      type: "update",
    });
    tick();

    const result: any = service.getConfig(testConfigId);

    const expectedForm1Config = {
      fieldGroups: [
        { fields: form1Config.cols[0] },
        { fields: form1Config.cols[1], header: form1Config.headers[1] },
      ],
    };
    const expectedForm2Config = {
      fieldGroups: [
        { fields: form2Config.cols[0] },
        { fields: form2Config.cols[1] },
      ],
    };

    expect(result.config.panels[0].components[0].config).toEqual(
      expectedForm1Config,
    );
    expect(result.config.panels[1].components[1].config).toEqual(
      expectedForm2Config,
    );
    expect(result.config.panels[1].components[0].config).toEqual(
      viewConfig.config.panels[1].components[0].config,
    );
    // keep new format unchanged:
    expect(result.config.panels[2].components[0].config).toEqual(formNewConfig);
  }));

  it("should migrate FormFieldConfig view/edit to viewComponent/editComponent", fakeAsync(() => {
    const testConfig1 = "view:test";
    const testConfig2 = "view:test/:id";

    const oldFieldConfig = { id: "name", view: "SomeView", edit: "SomeEdit" };

    const viewConfig1 = {
      component: "EntityDetails",
      config: {
        entity: "Entity",
        panels: [
          {
            components: [
              {
                title: "Form 1",
                component: "Form",
                config: {
                  cols: [[oldFieldConfig], ["other"]],
                },
              },
              {
                title: "Form 2",
                component: "Form",
                config: {
                  fieldGroups: [{ fields: ["other", oldFieldConfig] }],
                },
              },
            ],
          },
        ],
      },
    };

    const viewConfig2 = {
      component: "EntityList",
      config: {
        entity: "School",
        columns: [oldFieldConfig, "other"],
      },
    };

    updateSubject.next({
      entity: Object.assign(new Config(), {
        data: { [testConfig1]: viewConfig1, [testConfig2]: viewConfig2 },
      }),
      type: "update",
    });
    tick();

    const result1: any = service.getConfig(testConfig1);
    const result2: any = service.getConfig(testConfig2);

    const expectedFieldConfig = {
      id: "name",
      viewComponent: "SomeView",
      editComponent: "SomeEdit",
    };

    expect(
      result1.config.panels[0].components[0].config.fieldGroups[0].fields[0],
    ).toEqual(expectedFieldConfig);
    expect(
      result1.config.panels[0].components[1].config.fieldGroups[0].fields[1],
    ).toEqual(expectedFieldConfig);

    expect(result2.config.columns[0]).toEqual(expectedFieldConfig);
  }));

  it("should migrate menu item format", fakeAsync(() => {
    const config = new Config();
    const oldFormat = {
      items: [
        {
          name: "one",
          icon: "child",
          link: "/one",
        },
        {
          name: "two",
          icon: "child",
          link: "/two",
        },
      ],
    };
    const newFormat = {
      items: [
        {
          label: "one",
          icon: "child",
          link: "/one",
        },
        {
          label: "two",
          icon: "child",
          link: "/two",
        },
      ],
    };

    config.data = { navigationMenu: oldFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const actualFromOld =
      service.getConfig<NavigationMenuConfig>("navigationMenu");
    expect(actualFromOld).toEqual(newFormat);

    config.data = { navigationMenu: newFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const actualFromNew =
      service.getConfig<NavigationMenuConfig>("navigationMenu");
    expect(actualFromNew).toEqual(newFormat);
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

  it("should migrate entity-array dataType", fakeAsync(() => {
    const config = new Config();
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
    config.data = { "view:X": oldFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();

    const actualFromOld = service.getConfig("view:X");
    expect(actualFromOld).toEqual(newFormat);

    config.data = { "view:X": newFormat };
    updateSubject.next({ entity: config, type: "update" });
    tick();
    const actualFromNew = service.getConfig("view:X");
    expect(actualFromNew).toEqual(newFormat);
  }));

  fit("should migrate to new photo dataType", fakeAsync(() => {
    const config = new Config();
    const oldFormat = {
      attributes: {
        myPhoto: {
          dataType: "photo",
          editComponent: "EditPhoto",
          label: "My Photo",
        },
      },
    };
    const newFormat: EntityConfig = {
      attributes: {
        myPhoto: {
          dataType: "photo",
          label: "My Photo",
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
});
