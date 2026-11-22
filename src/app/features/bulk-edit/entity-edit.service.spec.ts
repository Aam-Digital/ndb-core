import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { EntityEditService } from "./entity-edit.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { EntityActionsService } from "#src/app/core/entity/entity-actions/entity-actions.service";
import { BulkOperationStateService } from "#src/app/core/entity/entity-actions/bulk-operation-state.service";
import { AutomatedFieldUpdateConfigService } from "#src/app/features/inherited-field/automated-field-update/automated-field-update-config.service";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("EntityEditService", () => {
  let service: EntityEditService;
  let saveAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveAll = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: { saveAll } },
        { provide: EntitySchemaService, useValue: {} },
        { provide: EntityRelationsService, useValue: {} },
        { provide: MatDialog, useValue: {} },
        { provide: EntityActionsService, useValue: {} },
        {
          provide: BulkOperationStateService,
          useValue: {
            startBulkOperation: vi.fn(),
            completeBulkOperation: vi.fn(),
          },
        },
        { provide: AutomatedFieldUpdateConfigService, useValue: {} },
      ],
    });
    service = TestBed.inject(EntityEditService);
  });

  it.each([null, undefined, "", []])(
    "removes the field from all records if the value is %j",
    async (value) => {
      const records = [
        TestEntity.create({ rating: 7 }),
        TestEntity.create({ rating: 3 }),
      ];

      const result = await service.editEntity(
        { selectedField: "rating", value },
        records,
      );

      for (const e of result.newEntities) {
        expect(Object.hasOwn(e, "rating")).toBe(false);
      }
      expect(saveAll).toHaveBeenCalledWith(result.newEntities);
      expect(records.map((e) => e.rating)).toEqual([7, 3]);
    },
  );

  it.each([0, false, "new"])(
    "sets the value %j on all records",
    async (value) => {
      const records = [
        TestEntity.create({ rating: 7 }),
        TestEntity.create({ rating: 3 }),
      ];

      const result = await service.editEntity(
        { selectedField: "rating", value },
        records,
      );

      expect(result.newEntities.map((e) => e.rating)).toEqual([value, value]);
    },
  );
});
