import { TestBed } from "@angular/core/testing";
import { ConfigCleanupService } from "./config-cleanup.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";

class Child extends Entity {
  static override readonly ENTITY_TYPE = "Child";
  static override readonly schema = new Map([
    [
      "gender",
      {
        dataType: "configurable-enum",
        additional: "genders",
      },
    ],
  ]);
}

class School extends Entity {
  static override readonly ENTITY_TYPE = "School";
  static override readonly schema = new Map([
    [
      "level",
      {
        dataType: "configurable-enum",
        additional: "ConfigurableEnum:levels",
      },
    ],
  ]);
}

describe("ConfigCleanupService", () => {
  let service: ConfigCleanupService;
  let mockEntityMapper: {
    loadType: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockEntityMapper = {
      loadType: vi.fn(),
      remove: vi.fn(),
    };

    const entityRegistry = new EntityRegistry();
    entityRegistry.set(Child.ENTITY_TYPE, Child);
    entityRegistry.set(School.ENTITY_TYPE, School);

    await TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    service = TestBed.inject(ConfigCleanupService);
  });

  it("should detect unused configurable enums from runtime schema", async () => {
    const genders = new ConfigurableEnum("genders");
    const levels = new ConfigurableEnum("levels");
    const unused = new ConfigurableEnum("unused");
    mockEntityMapper.loadType.mockResolvedValue([genders, levels, unused]);

    const analysis = await service.analyzeUnusedConfigurableEnums();

    expect(analysis.totalEnums).toBe(3);
    expect(analysis.usedEnums).toBe(2);
    expect(analysis.unusedEnums.map((x) => x.enumEntity.getId(true))).toEqual([
      "unused",
    ]);
  });

  it("should only delete enum that is still unused", async () => {
    const usedEnum = new ConfigurableEnum("genders");
    const deletedUsed = await service.deleteUnusedConfigurableEnum(usedEnum);
    expect(deletedUsed).toBe(false);
    expect(mockEntityMapper.remove).not.toHaveBeenCalled();

    const unusedEnum = new ConfigurableEnum("unused");
    const deletedUnused =
      await service.deleteUnusedConfigurableEnum(unusedEnum);
    expect(deletedUnused).toBe(true);
    expect(mockEntityMapper.remove).toHaveBeenCalledOnce();
    expect(mockEntityMapper.remove).toHaveBeenCalledWith(unusedEnum);
  });
});
