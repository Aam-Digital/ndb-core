import { TestBed } from "@angular/core/testing";
import { ConfigurableEnumService } from "./configurable-enum.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { NEVER } from "rxjs";
import { EntityAbility } from "../../permissions/ability/entity-ability";

describe("ConfigurableEnumService", () => {
  let service: ConfigurableEnumService;
  let mockEntityMapper: any;
  beforeEach(async () => {
    mockEntityMapper = {
      loadType: vi.fn(),
      receiveUpdates: vi.fn(),
    };
    mockEntityMapper.receiveUpdates.mockReturnValue(NEVER);
    mockEntityMapper.loadType.mockResolvedValue([]);
    await TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: EntityAbility, useValue: { can: () => true } },
      ],
    }).compileComponents();
    service = TestBed.inject(ConfigurableEnumService);
    await service.preLoadEnums();
  });

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  it("should create a new enum if it cannot be found", () => {
    const newEnum = service.getEnum("new-id");

    expect(newEnum.getId(true)).toEqual("new-id");
    expect(newEnum.values).toEqual([]);
    // returns same enum in consecutive calls
    expect(service.getEnum("new-id")).toBe(newEnum);
  });

  it("should not creat a new enum if the user is missing permissions", () => {
    vi.spyOn(TestBed.inject(EntityAbility), "can").mockReturnValue(false);
    expect(service.getEnum("new-id")).toBeUndefined();
  });
});
