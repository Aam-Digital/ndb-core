import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { firstValueFrom, Subject } from "rxjs";
import { UpdatedEntity } from "../entity/model/entity-update";
import { LoggingService } from "../logging/logging.service";
import { ConfigurableEnum } from "../configurable-enum/configurable-enum";
import { EntityAbility } from "../permissions/ability/entity-ability";
import { CoreModule } from "../core.module";
import { ComponentRegistry } from "../../dynamic-components";

describe("ConfigService", () => {
  let service: ConfigService;
  let entityMapper: jasmine.SpyObj<EntityMapperService>;
  const updateSubject = new Subject<UpdatedEntity<Config>>();

  beforeEach(() => {
    entityMapper = jasmine.createSpyObj([
      "load",
      "save",
      "receiveUpdates",
      "saveAll",
      "loadType",
    ]);
    entityMapper.receiveUpdates.and.returnValue(updateSubject);
    entityMapper.load.and.rejectWith();
    entityMapper.loadType.and.resolveTo([]);
    entityMapper.saveAll.and.resolveTo([]);
    entityMapper.save.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [
        ComponentRegistry,
        { provide: EntityMapperService, useValue: entityMapper },
        ConfigService,
        LoggingService,
        EntityAbility,
      ],
    });
    service = TestBed.inject(ConfigService);
    TestBed.inject(EntityAbility).update([
      { subject: "all", action: "manage" },
    ]);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load the config from the entity mapper", fakeAsync(() => {
    const testConfig = new Config();
    testConfig.data = { testKey: "testValue" };
    entityMapper.load.and.resolveTo(testConfig);

    service.loadConfig();
    expect(entityMapper.load).toHaveBeenCalled();
    tick();
    expect(service.getConfig("testKey")).toEqual("testValue");
  }));

  it("should emit the config once it is loaded", fakeAsync(() => {
    entityMapper.load.and.rejectWith("No config found");
    const configLoaded = firstValueFrom(service.configUpdates);

    service.loadConfig();
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
    service.loadConfig();
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
    service.loadConfig();
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

  it("should save enum configs to db it they dont exist yet", async () => {
    entityMapper.saveAll.and.resolveTo();
    const data = {
      "enum:1": [{ id: "some_id", label: "Some Label" }],
      "enum:two": [],
      "some:other": {},
    };
    const enum1 = new ConfigurableEnum("1");
    enum1.values = data["enum:1"];
    const enumTwo = new ConfigurableEnum("two");
    enumTwo.values = [];

    await initConfig(data);

    expect(entityMapper.saveAll).toHaveBeenCalledWith([enum1, enumTwo]);
    const config = entityMapper.save.calls.mostRecent().args[0] as Config;
    expect(config.data).toEqual({ "some:other": {} });
  });

  it("should not fail config initialization if changed config cannot be saved", async () => {
    entityMapper.saveAll.and.rejectWith();
    let configUpdate: Config;
    service.configUpdates.subscribe((config) => (configUpdate = config));

    await expectAsync(initConfig({ some: "config" })).toBeResolved();

    expect(service.getConfig("some")).toBe("config");
    expect(configUpdate.data).toEqual({ some: "config" });
  });

  it("should not save enums that already exist in db", async () => {
    entityMapper.loadType.and.resolveTo([new ConfigurableEnum("1")]);
    entityMapper.save.and.resolveTo();

    await initConfig({ "enum:1": [], "enum:2": [], some: "config" });

    expect(entityMapper.saveAll).toHaveBeenCalledWith([
      new ConfigurableEnum("2"),
    ]);
    expect(entityMapper.save).toHaveBeenCalledWith(jasmine.any(Config));
    expect(service.getConfig("enum:1")).toBeUndefined();
    expect(service.getConfig("some")).toBe("config");
  });

  it("should not save config if nothing has been changed", async () => {
    await initConfig({ some: "config", other: "config" });

    expect(entityMapper.save).not.toHaveBeenCalled();
    expect(entityMapper.saveAll).not.toHaveBeenCalled();
  });

  it("should not save config if permissions prevent it", async () => {
    // user can only read config
    TestBed.inject(EntityAbility).update([
      { subject: "Config", action: "read" },
    ]);

    await initConfig({ "enum:1": [], other: "config" });

    expect(entityMapper.save).not.toHaveBeenCalled();
  });

  function initConfig(data) {
    const config = new Config();
    config.data = data;
    entityMapper.load.and.resolveTo(config);
    return service.loadConfig();
  }
});
