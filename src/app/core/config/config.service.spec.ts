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

  it("should migrate entity attributes config to flattened format with id", fakeAsync(() => {
    const testConfigId = "entity:Test";
    const config = new Config();
    config.data = {
      [testConfigId]: {
        attributes: [
          {
            name: "count",
            schema: {
              dataType: "number",
            },
          },
        ],
      },
    };
    updateSubject.next({ entity: config, type: "update" });
    tick();

    const result = service.getConfig<EntityConfig>("entity:Test");

    expect(result.attributes).toEqual([{ id: "count", dataType: "number" }]);
  }));
  it("should not migrate / change entity attributes if already in new format", fakeAsync(() => {
    const testConfigId = "entity:Test";
    const entityAttributes = [{ id: "count", dataType: "number" }];
    const config = new Config();
    config.data = {
      [testConfigId]: {
        attributes: entityAttributes,
      },
    };
    updateSubject.next({ entity: config, type: "update" });
    tick();

    const result = service.getConfig<EntityConfig>("entity:Test");

    expect(result.attributes).toEqual(entityAttributes);
  }));
});
