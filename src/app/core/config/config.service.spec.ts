import { TestBed } from "@angular/core/testing";
import { firstValueFrom, Subject } from "rxjs";
import { DefaultValueConfig } from "../default-values/default-value-config";
import { EntityConfig } from "../entity/entity-config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { UpdatedEntity } from "../entity/model/entity-update";
import { Config } from "./config";
import { ConfigService } from "./config.service";

describe("ConfigService", () => {
  let service: ConfigService;
  let entityMapper: any;
  const updateSubject = new Subject<UpdatedEntity<Config>>();

  beforeEach(() => {
    entityMapper = {
      load: vi.fn(),
      save: vi.fn(),
      receiveUpdates: vi.fn(),
    };
    entityMapper.receiveUpdates.mockReturnValue(updateSubject);
    entityMapper.load.mockRejectedValue();
    entityMapper.save.mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    });
    service = TestBed.inject(ConfigService);
  });

  /**
   * Check that config is migrated as expected (and doesn't destroy new config)
   * @param oldFormat Config.data object to test
   * @param expectedNewFormat Config.data object expected after migration
   */
  async function testConfigMigration(
    oldFormat: Object,
    expectedNewFormat: Object,
  ) {
    const config = new Config();

    config.data = JSON.parse(JSON.stringify(oldFormat));
    updateSubject.next({ entity: config, type: "update" });
    await Promise.resolve();
    expectConfigToMatch(expectedNewFormat);

    config.data = JSON.parse(JSON.stringify(expectedNewFormat));
    updateSubject.next({ entity: config, type: "update" });
    await Promise.resolve();
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

  it("should load the config from the entity mapper", async () => {
    vi.useFakeTimers();
    try {
      const testConfig = new Config();
      testConfig.data = { testKey: "testValue" };
      entityMapper.load.mockResolvedValue(testConfig);

      service.loadOnce();
      expect(entityMapper.load).toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(0);
      expect(service.getConfig("testKey")).toEqual("testValue");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should emit the config once it is loaded", async () => {
    vi.useFakeTimers();
    try {
      entityMapper.load.mockRejectedValue("No config found");
      const configLoaded = firstValueFrom(service.configUpdates);

      service.loadOnce();
      await vi.advanceTimersByTimeAsync(0);
      expect(() => service.getConfig("testKey")).toThrowError();

      const testConfig = new Config();
      testConfig.data = { testKey: "testValue" };
      updateSubject.next({ type: "new", entity: testConfig });
      await vi.advanceTimersByTimeAsync(0);

      expect(service.getConfig("testKey")).toBe("testValue");
      return expect(configLoaded).resolves.toEqual(testConfig);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should correctly return prefixed fields", async () => {
    vi.useFakeTimers();
    try {
      const testConfig = new Config();
      testConfig.data = {
        "test:1": { name: "first" },
        "other:1": { name: "wrong" },
        "test:2": { name: "second" },
      };
      entityMapper.load.mockResolvedValue(testConfig);
      service.loadOnce();
      await vi.advanceTimersByTimeAsync(0);
      const result = service.getAllConfigs<any>("test:");
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ name: "first", _id: "test:1" });
      expect(result).toContainEqual({ name: "second", _id: "test:2" });
      expect(result).not.toContain({ name: "wrong", _id: "other:1" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("should return single field", async () => {
    vi.useFakeTimers();
    try {
      const testConfig = new Config();
      testConfig.data = { first: "correct", second: "wrong" };
      entityMapper.load.mockResolvedValue(testConfig);
      service.loadOnce();
      await vi.advanceTimersByTimeAsync(0);
      const result = service.getConfig<any>("first");
      expect(result).toBe("correct");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should save a new config", () => {
    const newConfig = { test: "data" };
    service.saveConfig(newConfig);
    expect(entityMapper.save).toHaveBeenCalled();
    const lastCall = vi.mocked(entityMapper.save).mock.lastCall[0] as Config;
    expect(lastCall).toBeInstanceOf(Config);
    expect(lastCall.data).toEqual({ test: "data" });
  });

  it("should create export config string", async () => {
    vi.useFakeTimers();
    try {
      const config = new Config();
      config.data = { first: "foo", second: "bar" };
      // @ts-ignore disable migrations for this test
      vi.spyOn(service, "applyMigrations").mockImplementation((c) => c);

      const expected = JSON.stringify(config.data);
      updateSubject.next({ entity: config, type: "update" });
      await vi.advanceTimersByTimeAsync(0);
      const result = service.exportConfig();
      expect(result).toEqual(expected);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should migrate entity-array dataType", async () => {
    vi.useFakeTimers();
    try {
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
      await vi.advanceTimersByTimeAsync(0);

      const actualFromOld = service.getConfig<EntityConfig>("entity:X");
      expect(actualFromOld).toEqual(newFormat);

      config.data = { "entity:X": newFormat };
      updateSubject.next({ entity: config, type: "update" });
      await vi.advanceTimersByTimeAsync(0);
      const actualFromNew = service.getConfig<EntityConfig>("entity:X");
      expect(actualFromNew).toEqual(newFormat);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should migrate ChildrenList", async () => {
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

    await testConfigMigration({ "view:X": oldFormat }, { "view:X": newFormat });
  });

  it("should migrate legacy .id OR filters to new format", async () => {
    const oldFormat = {
      "appConfig:matching-entities": {
        leftSide: {
          prefilter: {
            $or: [
              { "projectStatus.id": "test_id1" },
              { "projectStatus.id": "test_id2" },
              { "projectStatus.id": "test_id3" },
              { "otherField.id": "A" },
              { name: "Test" },
            ],
          },
        },
      },
    };

    const newFormat = {
      "appConfig:matching-entities": {
        leftSide: {
          prefilter: {
            $or: [
              { projectStatus: "test_id1" },
              { projectStatus: "test_id2" },
              { projectStatus: "test_id3" },
              { otherField: "A" },
              { name: "Test" },
            ],
          },
        },
      },
    };

    await testConfigMigration(oldFormat, newFormat);
  });

  it("should migrate to new photo dataType", async () => {
    vi.useFakeTimers();
    try {
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
      await vi.advanceTimersByTimeAsync(0);
      const actualFromOld = service.getConfig<EntityConfig>("entity:X");
      expect(actualFromOld).toEqual(newFormat);

      config.data = { "entity:X": newFormat };
      updateSubject.next({ entity: config, type: "update" });
      await vi.advanceTimersByTimeAsync(0);
      const actualFromNew = service.getConfig<EntityConfig>("entity:X");
      expect(actualFromNew).toEqual(newFormat);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should migrate to Percentage dataType", async () => {
    vi.useFakeTimers();
    try {
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
      await vi.advanceTimersByTimeAsync(0);
      const actualFromOld = service.getConfig<EntityConfig>("entity:X");
      expect(actualFromOld).toEqual(newFormat);

      config.data = { "entity:X": newFormat };
      updateSubject.next({ entity: config, type: "update" });
      await vi.advanceTimersByTimeAsync(0);
      const actualFromNew = service.getConfig<EntityConfig>("entity:X");
      expect(actualFromNew).toEqual(newFormat);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should migrate ChildBlock config", async () => {
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
            image: "photo",
            fields: ["phone", "schoolId", "schoolClass"],
          },
        },
      },
    );
  });

  it("should wrap groupBy as an array if it is a string", async () => {
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
  });

  it("should migrate defaultValue mode 'inherited' to 'inherited-field'", async () => {
    vi.useFakeTimers();
    try {
      const previousDefaultValueConfig = {
        mode: "inherited",
        localAttribute: "localAttribute",
        field: "field",
      };

      const expectedDefaultValueConfig: DefaultValueConfig = {
        mode: "inherited-field",
        config: {
          sourceReferenceField: "localAttribute",
          sourceValueField: "field",
        },
      };

      let testEntity = "entity:old-format";
      updateSubject.next({
        entity: Object.assign(new Config(), {
          data: {
            [testEntity]: {
              attributes: {
                fieldName: {
                  defaultValue: previousDefaultValueConfig,
                },
              },
            },
          },
        }),
        type: "update",
      });
      await vi.advanceTimersByTimeAsync(0);

      const config = service.getConfig(testEntity);
      expect(config["attributes"].fieldName.defaultValue).toEqual(
        expectedDefaultValueConfig,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should migrate defaultValue mode 'dynamic' new config format", async () => {
    vi.useFakeTimers();
    try {
      const previousDefaultValueConfig = {
        mode: "dynamic",
        value: "$now",
      };

      const expectedDefaultValueConfig: DefaultValueConfig = {
        mode: "dynamic",
        config: {
          value: "$now",
        },
      };

      let testEntity = "entity:old-format";
      updateSubject.next({
        entity: Object.assign(new Config(), {
          data: {
            [testEntity]: {
              attributes: {
                fieldName: {
                  defaultValue: previousDefaultValueConfig,
                },
              },
            },
          },
        }),
        type: "update",
      });
      await vi.advanceTimersByTimeAsync(0);

      const config = service.getConfig(testEntity);
      expect(config["attributes"].fieldName.defaultValue).toEqual(
        expectedDefaultValueConfig,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should migrate deprecated ChildSchoolOverview components", async () => {
    const oldConfig = {
      "view:child/:id": {
        entityType: "Child",
        panels: [
          {
            components: [
              { component: "ChildSchoolOverview" },
              { component: "OtherComponent", config: {} },
            ],
          },
        ],
      },
      "view:school/:id": {
        entityType: "School",
        panels: [
          {
            components: [
              { component: "ChildSchoolOverview" },
              { component: "OtherComponent", config: {} },
            ],
          },
        ],
      },
    };

    const expectedConfig = {
      "view:child/:id": {
        entityType: "Child",
        panels: [
          {
            components: [
              {
                component: "RelatedEntities",
                config: {
                  entityType: "ChildSchoolRelation",
                  columns: [
                    { id: "start", visibleFrom: "md" },
                    { id: "end", visibleFrom: "md" },
                    { id: "schoolId" },
                    { id: "schoolClass" },
                    { id: "result" },
                  ],
                  loaderMethod: "ChildrenServiceQueryRelations",
                  showInactive: true,
                },
              },
              { component: "OtherComponent", config: {} },
            ],
          },
        ],
      },
      "view:school/:id": {
        entityType: "School",
        panels: [
          {
            components: [
              {
                component: "RelatedEntities",
                config: {
                  entityType: "ChildSchoolRelation",
                  columns: [
                    { id: "childId" },
                    { id: "start", visibleFrom: "md" },
                    { id: "end", visibleFrom: "md" },
                    { id: "schoolClass" },
                    { id: "result" },
                  ],
                  loaderMethod: "ChildrenServiceQueryRelations",
                },
              },
              { component: "OtherComponent", config: {} },
            ],
          },
        ],
      },
    };

    testConfigMigration(oldConfig, expectedConfig);
  });

  it("should migrate EditDescriptionOnly fields", async () => {
    const oldConfig = {
      fields: [
        {
          id: "_description1",
          editComponent: "EditDescriptionOnly",
          label: "foo bar",
        },
      ],
    };

    const expectedConfig = {
      fields: [
        {
          id: "_description1",
          viewComponent: "DisplayDescriptionOnly",
          label: "foo bar",
        },
      ],
    };

    testConfigMigration(oldConfig, expectedConfig);
  });

  it("should migrate NotesManager to EntityList and preserve other config properties", async () => {
    const oldConfig = {
      "view:child/:id": {
        component: "NotesManager",
        config: {
          includeEventNotes: true,
          showEventNotesToggle: true,
          columns: ["date", "subject"],
          filters: [{ id: "status" }],
        },
      },
    };

    const expectedConfig = {
      "view:child/:id": {
        component: "EntityList",
        config: {
          entityType: "Note",
          clickMode: "popup-details",
          columns: ["date", "subject"],
          filters: [{ id: "status" }],
        },
      },
    };

    testConfigMigration(oldConfig, expectedConfig);
  });

  it("should migrate editComponent EditAttendance to EditLegacyAttendance", async () => {
    const oldConfig = {
      "entity:Note": {
        attributes: {
          children: {
            dataType: "entity",
            isArray: true,
            additional: "Child",
            editComponent: "EditAttendance",
          },
        },
      },
    };

    const expectedConfig = {
      "entity:Note": {
        attributes: {
          children: {
            dataType: "entity",
            isArray: true,
            additional: "Child",
            editComponent: "EditLegacyAttendance",
          },
        },
      },
    };

    testConfigMigration(oldConfig, expectedConfig);
  });
});
