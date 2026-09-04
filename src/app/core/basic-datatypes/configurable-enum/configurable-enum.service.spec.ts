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

  it("resolves multi-lingual option labels while leaving the cached enum raw (#3862)", () => {
    const rawLabel = { "en-US": "Male", de: "Männlich" };
    const enumEntity = service.getEnum("genders");
    enumEntity.values = [{ id: "M", label: rawLabel } as any];

    const options = service.getEnumValues("genders");

    // the active locale in tests is en-US
    expect(options).toEqual([{ id: "M", label: "Male" }]);
    // the cached entity keeps every language, so editing and saving it is safe
    expect(enumEntity.values[0].label).toEqual(rawLabel);
    // and the returned options are copies, not the cached objects
    expect(options[0]).not.toBe(enumEntity.values[0]);
  });

  it("never translates option ids, since entity data references them", () => {
    const enumEntity = service.getEnum("some-enum");
    enumEntity.values = [
      { id: "OPTION_KEY", label: { "en-US": "Text", de: "Text DE" } } as any,
    ];

    expect(service.getEnumValues("some-enum")[0].id).toBe("OPTION_KEY");
  });
});
