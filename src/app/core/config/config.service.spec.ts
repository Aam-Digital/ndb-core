import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";

describe("ConfigService", () => {
  let service: ConfigService;
  const entityMapper: jasmine.SpyObj<EntityMapperService> = jasmine.createSpyObj(
    "entityMapper",
    ["load", "save"]
  );

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load the config from the entity mapper", fakeAsync(() => {
    const testConfig: Config = new Config();
    testConfig.data = { testKey: "testValue" };
    entityMapper.load.and.returnValue(Promise.resolve(testConfig));
    service.loadConfig(entityMapper);
    expect(entityMapper.load).toHaveBeenCalled();
    tick();
    expect(service.getConfig("testKey")).toEqual("testValue");
  }));

  it("should use the default config when none is loaded", fakeAsync(() => {
    const configBefore = service.getAllConfigs("");
    entityMapper.load.and.returnValue(Promise.resolve(null));
    service.loadConfig(entityMapper);
    tick();
    const configAfter = service.getAllConfigs("");
    expect(configAfter).toEqual(configBefore);
    expect(configAfter).not.toBeNull();
  }));

  it("should correctly return prefixed fields", fakeAsync(() => {
    const testConfig = new Config();
    testConfig.data = {
      "test:1": { name: "first" },
      "other:1": { name: "wrong" },
      "test:2": { name: "second" },
    };
    entityMapper.load.and.returnValue(Promise.resolve(testConfig));
    service.loadConfig(entityMapper);
    tick();
    const result = service.getAllConfigs<any>("test:");
    expect(result.length).toBe(2);
    expect(result).toContain({ name: "first", _id: "test:1" });
    expect(result).toContain({ name: "second", _id: "test:2" });
    expect(result).not.toContain({ name: "wrong", _id: "other:1" });
  }));

  it("should return single field", fakeAsync(() => {
    const testConfig = new Config();
    testConfig.data = { first: "correct", second: "wrong" };
    entityMapper.load.and.returnValue(Promise.resolve(testConfig));
    service.loadConfig(entityMapper);
    tick();
    const result = service.getConfig<any>("first");
    expect(result).toBe("correct");
  }));

  it("should save a new config", () => {
    const newConfig = { test: "data" };
    service.saveConfig(entityMapper, newConfig);
    expect(entityMapper.save).toHaveBeenCalled();
    expect(entityMapper.save.calls.mostRecent().args[0]).toBeInstanceOf(Config);
    expect(
      (entityMapper.save.calls.mostRecent().args[0] as Config).data
    ).toEqual({ test: "data" });
  });

  it("should keep the same entity id when saving", fakeAsync(() => {
    const initialConfig = new Config("initialId");
    entityMapper.load.and.returnValue(Promise.resolve(initialConfig));
    service.loadConfig(entityMapper);
    tick();
    const newData = { first: "foo", second: "bar" };
    service.saveConfig(entityMapper, newData);
    expect(entityMapper.save.calls.mostRecent().args[0].entityId).toEqual(
      "initialId"
    );
  }));

  it("should create export config string", fakeAsync(() => {
    const config = new Config();
    config.data = { first: "foo", second: "bar" };
    const expected = JSON.stringify(config.data);
    entityMapper.load.and.returnValue(Promise.resolve(config));
    service.loadConfig(entityMapper);
    tick();
    const result = service.exportConfig();
    expect(result).toEqual(expected);
  }));
});
