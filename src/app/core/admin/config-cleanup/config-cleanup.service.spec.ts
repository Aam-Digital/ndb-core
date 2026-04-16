import { TestBed } from "@angular/core/testing";
import { ConfigCleanupService } from "./config-cleanup.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntitySchema } from "../../entity/schema/entity-schema";

class AttendanceItemMock {
  static readonly schema: EntitySchema = new Map([
    [
      "status",
      {
        dataType: "configurable-enum",
        additional: "attendance-status",
      },
    ],
  ]);
}

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

class Event extends Entity {
  static override readonly ENTITY_TYPE = "Event";
  static override readonly schema = new Map([
    [
      "attendance",
      {
        dataType: "attendance",
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
  let mockEntitySchemaService: {
    getDatatypeOrDefault: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockEntityMapper = {
      loadType: vi.fn(),
      remove: vi.fn(),
    };

    mockEntitySchemaService = {
      getDatatypeOrDefault: vi.fn((datatypeName: string) => {
        if (datatypeName === "attendance") {
          return { embeddedType: AttendanceItemMock };
        }
        return undefined;
      }),
    };

    const entityRegistry = new EntityRegistry();
    entityRegistry.set(Child.ENTITY_TYPE, Child);
    entityRegistry.set(School.ENTITY_TYPE, School);
    entityRegistry.set(Event.ENTITY_TYPE, Event);

    await TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: EntitySchemaService, useValue: mockEntitySchemaService },
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
    expect(
      analysis.usedEnumDetails.map((x) => x.enumEntity.getId(true)),
    ).toEqual(["genders", "levels"]);
    expect(analysis.unusedEnums.map((x) => x.enumEntity.getId(true))).toEqual([
      "unused",
    ]);
  });

  it("should detect configurable-enum usage in embedded schema datatypes", async () => {
    const attendanceStatus = new ConfigurableEnum("attendance-status");
    const unused = new ConfigurableEnum("unused");
    mockEntityMapper.loadType.mockResolvedValue([attendanceStatus, unused]);

    const analysis = await service.analyzeUnusedConfigurableEnums();

    expect(
      analysis.usedEnumDetails.map((x) => x.enumEntity.getId(true)),
    ).toEqual(["attendance-status"]);
    expect(analysis.usedEnumDetails[0].usages).toEqual([
      {
        entityType: "Event",
        fieldId: "attendance.status",
      },
    ]);
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
