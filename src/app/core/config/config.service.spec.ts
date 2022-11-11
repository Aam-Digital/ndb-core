import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { firstValueFrom, Subject } from "rxjs";
import { UpdatedEntity } from "../entity/model/entity-update";
import { LoggingService } from "../logging/logging.service";

describe("ConfigService", () => {
  let service: ConfigService;
  let entityMapper: jasmine.SpyObj<EntityMapperService>;
  const updateSubject = new Subject<UpdatedEntity<Config>>();

  beforeEach(() => {
    entityMapper = jasmine.createSpyObj(["load", "save", "receiveUpdates"]);
    entityMapper.receiveUpdates.and.returnValue(updateSubject);
    entityMapper.load.and.rejectWith();
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        ConfigService,
        LoggingService,
      ],
    });
    service = TestBed.inject(ConfigService);
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
    entityMapper.load.and.returnValue(Promise.resolve(testConfig));
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
    entityMapper.load.and.returnValue(Promise.resolve(testConfig));
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

  it("should create export config string", () => {
    const config = new Config();
    config.data = { first: "foo", second: "bar" };
    const expected = JSON.stringify(config.data);
    updateSubject.next({ entity: config, type: "update" });
    const result = service.exportConfig();
    expect(result).toEqual(expected);
  });
});
