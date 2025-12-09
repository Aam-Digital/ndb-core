import { TestBed } from "@angular/core/testing";
import { PrimaryActionService } from "./primary-action.service";
import { ConfigService } from "../../config/config.service";
import { PrimaryActionConfig } from "./primary-action-config";

describe("PrimaryActionService", () => {
  let service: PrimaryActionService;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj("ConfigService", ["getConfig"]);

    TestBed.configureTestingModule({
      providers: [
        PrimaryActionService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    });

    service = TestBed.inject(PrimaryActionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return config from ConfigService if available", () => {
    const mockConfig: PrimaryActionConfig = {
      icon: "plus",
      actionType: "createEntity",
      entityType: "Child",
      route: "",
    };
    mockConfigService.getConfig.and.returnValue(mockConfig);

    const result = service.getCurrentConfig();

    expect(result).toEqual(mockConfig);
    expect(mockConfigService.getConfig).toHaveBeenCalledWith("primaryAction");
  });

  it("should return default config if ConfigService returns undefined", () => {
    mockConfigService.getConfig.and.returnValue(undefined);

    const result = service.getCurrentConfig();

    expect(result).toEqual(service.defaultConfig);
    expect(result.icon).toBe("file-alt");
    expect(result.actionType).toBe("createEntity");
    expect(result.entityType).toBe("Note");
  });

  it("should return entity types that have labels and are not internal", () => {
    const result = service.getEntityTypeOptions();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Verify all returned entities have required properties
    result.forEach((entityConstructor) => {
      expect(entityConstructor.label).toBeDefined();
      expect(entityConstructor.label).not.toBe("");
      expect(entityConstructor.isInternalEntity).toBeFalsy();
    });
  });

  it("should return constructor for specified entity type", () => {
    const result = service.getEntityConstructor("Note");

    expect(result).toBeDefined();
    expect(result.ENTITY_TYPE).toBe("Note");
  });

  it("should return Note constructor when entityType is not provided", () => {
    const result = service.getEntityConstructor();

    expect(result).toBeDefined();
    expect(result.ENTITY_TYPE).toBe("Note");
  });
});
