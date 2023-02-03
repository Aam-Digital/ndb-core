import { TestBed } from "@angular/core/testing";
import { ConfigurableEnumService } from "./configurable-enum.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { ConfigService } from "../config/config.service";
import { NEVER, of } from "rxjs";

describe("ConfigurableEnumService", () => {
  let service: ConfigurableEnumService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj([
      "save",
      "loadType",
      "receiveUpdates",
    ]);
    mockEntityMapper.receiveUpdates.and.returnValue(NEVER);
    mockEntityMapper.loadType.and.resolveTo([]);
    mockConfigService = jasmine.createSpyObj([], { configUpdates: of({}) });
    await TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();
    service = TestBed.inject(ConfigurableEnumService);
  });

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  it("should create a new enum if it cannot be found", () => {
    const newEnum = service.getEnum("new-id");

    expect(newEnum.getId()).toEqual("new-id");
    expect(newEnum.values).toEqual([]);
    expect(mockEntityMapper.save).toHaveBeenCalledWith(newEnum);
    // returns same enum in consecutive calls
    expect(service.getEnum("new-id")).toBe(newEnum);
  });
});
