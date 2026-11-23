import { TestBed } from "@angular/core/testing";
import { DuplicateRecordService } from "./duplicate-records.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { UpdateMetadata } from "../../entity/model/update-metadata";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { StringDatatype } from "../../basic-datatypes/string/string.datatype";
import { BooleanDatatype } from "../../basic-datatypes/boolean/boolean.datatype";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { BulkOperationStateService } from "../../entity/entity-actions/bulk-operation-state.service";

describe("DuplicateRecordsService", () => {
  let service: DuplicateRecordService;
  let entityMapperService: EntityMapperService;

  @DatabaseEntity("DuplicateTestEntity")
  class DuplicateTestEntity extends Entity {
    static override toStringAttributes = ["name"];
    @DatabaseField()
    name: string;
    @DatabaseField()
    boolProperty: boolean;
    @DatabaseField()
    override created: UpdateMetadata;
    @DatabaseField()
    override updated: UpdateMetadata;
    @DatabaseField()
    override inactive: boolean;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        DuplicateRecordService,
        {
          provide: EntityMapperService,
          useValue: {
            saveAll: vi.fn(),
          },
        },
        {
          provide: BulkOperationStateService,
          useValue: {
            startBulkOperation: vi.fn(),
            waitForBulkOperationToFinish: vi.fn(),
          },
        },
        EntitySchemaService,
        { provide: DefaultDatatype, useClass: DefaultDatatype, multi: true },
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        { provide: DefaultDatatype, useClass: BooleanDatatype, multi: true },
      ],
    });
    service = TestBed.inject(DuplicateRecordService);
    entityMapperService = TestBed.inject(EntityMapperService);
    const bulkOperationState = TestBed.inject(BulkOperationStateService) as any;
    bulkOperationState.waitForBulkOperationToFinish.mockResolvedValue(
      undefined,
    );
  });

  it("should transform data correctly", () => {
    const duplicateTest = new DuplicateTestEntity();
    duplicateTest.name = "TestName";
    duplicateTest.boolProperty = true;

    const originalData = [duplicateTest];
    const transformedData = service.clone(originalData);

    expect(transformedData[0]).toBeInstanceOf(Entity);
    expect(transformedData[0]._id).toBeDefined();
    expect(transformedData[0]._id).not.toBe(duplicateTest["_id"]);
    expect(transformedData[0].name).toMatch(/^Copy of /);
    expect(transformedData[0].boolProperty).toBe(true);
  });

  it("should save duplicate record", async () => {
    const duplicateTestEntity = new DuplicateTestEntity();
    duplicateTestEntity.name = "TestName";
    duplicateTestEntity.boolProperty = true;
    duplicateTestEntity.inactive = false;

    const originalData = [duplicateTestEntity];
    const cloneSpy = vi.spyOn(service, "clone");

    await service.duplicateRecord(originalData);

    expect(cloneSpy).toHaveBeenCalledWith(originalData);
    expect(entityMapperService.saveAll).toHaveBeenCalled();
  });

  it("should not wait for a list to complete a bulk operation when duplicating a single record", async () => {
    // e.g. from the details page or a dialog: there is no list of this type that could complete the bulk operation
    const bulkOperationState = TestBed.inject(BulkOperationStateService);
    const entity = new DuplicateTestEntity();
    entity.name = "TestName";

    await expect(service.duplicateRecord(entity)).resolves.toBe(true);

    expect(entityMapperService.saveAll).toHaveBeenCalledTimes(1);
    expect(bulkOperationState.startBulkOperation).not.toHaveBeenCalled();
    expect(
      bulkOperationState.waitForBulkOperationToFinish,
    ).not.toHaveBeenCalled();
  });

  it("should run as a bulk operation when duplicating multiple records", async () => {
    const bulkOperationState = TestBed.inject(BulkOperationStateService);
    const entities = ["A", "B"].map((name) => {
      const entity = new DuplicateTestEntity();
      entity.name = name;
      return entity;
    });

    await service.duplicateRecord(entities);

    const savedIds = (entityMapperService.saveAll as any).mock.calls[0][0].map(
      (e: Entity) => e.getId(),
    );
    expect(bulkOperationState.startBulkOperation).toHaveBeenCalledWith(
      2,
      savedIds,
    );
    expect(bulkOperationState.waitForBulkOperationToFinish).toHaveBeenCalled();
  });
});
