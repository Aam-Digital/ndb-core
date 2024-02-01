import { TestBed } from "@angular/core/testing";
import { ConfigurableEnumService } from "./configurable-enum.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { NEVER } from "rxjs";
import { EntityAbility } from "../../permissions/ability/entity-ability";

describe("ConfigurableEnumService", () => {
  let service: ConfigurableEnumService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType", "receiveUpdates"]);
    mockEntityMapper.receiveUpdates.and.returnValue(NEVER);
    mockEntityMapper.loadType.and.resolveTo([]);
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
    spyOn(TestBed.inject(EntityAbility), "can").and.returnValue(false);
    expect(service.getEnum("new-id")).toBeUndefined();
  });
});
