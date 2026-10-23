import { TestBed } from "@angular/core/testing";
import { firstValueFrom, Subject } from "rxjs";
import { DefaultValueConfig } from "../default-values/default-value-config";
import { EntityConfig } from "../entity/entity-config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { UpdatedEntity } from "../entity/model/entity-update";
import { HttpStatusCode } from "@angular/common/http";
import { Config } from "./config";
import { ConfigService } from "./config.service";
import { Logging } from "../logging/logging.service";
import { ConfigValidationService } from "./config-validation/config-validation.service";

describe("ConfigService", () => {
  let service: ConfigService;
  let entityMapper: any;
  let mockConfigValidation: {
    warnAdminAboutProblems: ReturnType<typeof vi.fn>;
  };
  const updateSubject = new Subject<UpdatedEntity<Config>>();

  beforeEach(() => {
    sessionStorage.clear();
    entityMapper = {
      load: vi.fn(),
      save: vi.fn(),
      receiveUpdates: vi.fn(),
    };
    entityMapper.receiveUpdates.mockReturnValue(updateSubject);
    entityMapper.load.mockRejectedValue();
    entityMapper.save.mockResolvedValue([]);
    mockConfigValidation = { warnAdminAboutProblems: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: ConfigValidationService, useValue: mockConfigValidation },
      ],
    });
    service = TestBed.inject(ConfigService);
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
      expect(service.getConfig("testKey")).toBeUndefined();

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

  it("should warn about config problems when the config is saved, but not on the initial load", async () => {
    vi.useFakeTimers();
    try {
      const initialConfig = new Config();
      initialConfig.data = { testKey: "initial" };
      initialConfig._rev = "1-a";
      entityMapper.load.mockResolvedValue(initialConfig);
      service.loadOnce();
      await vi.advanceTimersByTimeAsync(0);
      expect(
        mockConfigValidation.warnAdminAboutProblems,
      ).not.toHaveBeenCalled();

      const savedConfig = new Config();
      savedConfig.data = { testKey: "saved" };
      savedConfig._rev = "2-b";
      updateSubject.next({ type: "update", entity: savedConfig });
      await vi.advanceTimersByTimeAsync(0);

      expect(mockConfigValidation.warnAdminAboutProblems).toHaveBeenCalledWith(
        expect.objectContaining({ testKey: "saved" }),
      );
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

  describe("undefined config handling", () => {
    /**
     * Sets up window.location/alert/Logging.error mocks for testing
     * ConfigService's abortWithError/reload behavior, then flushes and resets
     * the incidental background load that TestBed.inject(ConfigService)
     * always triggers in beforeEach (using the outer beforeEach's default
     * rejected mock) - otherwise it silently consumes the reload-attempt
     * budget meant for the test's own explicit scenario below.
     */
    async function setupReloadTest() {
      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: reloadMock },
        writable: true,
      });
      vi.spyOn(window, "alert").mockImplementation(() => {});
      vi.spyOn(Logging, "error").mockImplementation(() => {});

      await vi.advanceTimersByTimeAsync(0);
      sessionStorage.clear();
      reloadMock.mockClear();
      vi.mocked(window.alert).mockClear();
      vi.mocked(Logging.error).mockClear();

      return { reloadMock };
    }

    it("should return empty array from getAllConfigs when config is not loaded", () => {
      expect(service.getAllConfigs("view:")).toEqual([]);
    });

    it("should return undefined from getConfig when config is not loaded", () => {
      expect(service.getConfig("anyKey")).toBeUndefined();
    });

    it("should return empty export when config is not loaded", () => {
      expect(service.exportConfig()).toBe("{}");
      expect(service.exportConfig(true)).toEqual({});
    });

    it("should return empty array from getAllConfigs when config data is undefined", async () => {
      vi.useFakeTimers();
      try {
        const config = new Config();
        config.data = undefined;
        entityMapper.load.mockResolvedValue(config);
        service.loadOnce();
        await vi.advanceTimersByTimeAsync(0);

        expect(service.getAllConfigs("view:")).toEqual([]);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should return undefined from getConfig when config data is undefined", async () => {
      vi.useFakeTimers();
      try {
        const config = new Config();
        config.data = undefined;
        entityMapper.load.mockResolvedValue(config);
        service.loadOnce();
        await vi.advanceTimersByTimeAsync(0);

        expect(service.getConfig("anyKey")).toBeUndefined();
      } finally {
        vi.useRealTimers();
      }
    });

    it("should abort app on non-404 config load error", async () => {
      vi.useFakeTimers();
      try {
        const { reloadMock } = await setupReloadTest();

        const dbError = { status: 500, message: "Internal Server Error" };
        entityMapper.load.mockRejectedValue(dbError);

        service.loadOnce();
        await vi.advanceTimersByTimeAsync(0);

        expect(Logging.error).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
        expect(reloadMock).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        vi.restoreAllMocks();
      }
    });

    it("should abort app when config loads with undefined data", async () => {
      vi.useFakeTimers();
      try {
        const { reloadMock } = await setupReloadTest();

        const config = new Config();
        config.data = undefined;
        entityMapper.load.mockResolvedValue(config);

        service.loadOnce();
        await vi.advanceTimersByTimeAsync(0);

        expect(Logging.error).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
        expect(reloadMock).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        vi.restoreAllMocks();
      }
    });

    it("should not abort app when the config doc is deleted (e.g. admin resetting the system)", async () => {
      vi.useFakeTimers();
      try {
        const { reloadMock } = await setupReloadTest();

        // a deleted doc holds no data, which must not be reported as a corrupt config
        updateSubject.next({ entity: new Config(), type: "remove" });
        await vi.advanceTimersByTimeAsync(0);

        expect(Logging.error).not.toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
        expect(reloadMock).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        vi.restoreAllMocks();
      }
    });

    it("should stop auto-reloading after the retry budget is exhausted to avoid a reload loop", async () => {
      vi.useFakeTimers();
      try {
        const { reloadMock } = await setupReloadTest();

        const dbError = { status: 500, message: "Internal Server Error" };
        entityMapper.load.mockRejectedValue(dbError);

        // first failure is still within the retry budget -> reloads once
        service.loadOnce();
        await vi.advanceTimersByTimeAsync(0);
        expect(reloadMock).toHaveBeenCalledTimes(1);

        // simulates the reloaded page failing again -> retry budget exhausted, no more reload
        service.loadOnce();
        await vi.advanceTimersByTimeAsync(0);
        expect(reloadMock).toHaveBeenCalledTimes(1);
        expect(window.alert).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
        vi.restoreAllMocks();
      }
    });

    it("should not abort on 404 error (first-time setup)", async () => {
      vi.useFakeTimers();
      try {
        const reloadMock = vi.fn();
        Object.defineProperty(window, "location", {
          value: { reload: reloadMock },
          writable: true,
        });
        vi.spyOn(window, "alert").mockImplementation(() => {});

        const notFoundError = { status: HttpStatusCode.NotFound };
        entityMapper.load.mockRejectedValue(notFoundError);

        service.loadOnce();
        await vi.advanceTimersByTimeAsync(0);

        expect(service.hasConfig()).toBe(false);
        expect(window.alert).not.toHaveBeenCalled();
        expect(reloadMock).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        vi.restoreAllMocks();
      }
    });
  });
});
