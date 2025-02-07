import { TestBed } from "@angular/core/testing";
import { DuplicateRecordService } from "./duplicate-records.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { UpdateMetadata } from "../../entity/model/update-metadata";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { StringDatatype } from "../../basic-datatypes/string/string.datatype";
import { BooleanDatatype } from "../../basic-datatypes/boolean/boolean.datatype";

describe("DuplicateRecordsService", () => {
  let service: DuplicateRecordService;
  let entityMapperService: EntityMapperService;

  @DatabaseEntity("DuplicateTestEntity")
  class DuplicateTestEntity extends Entity {
    static override toStringAttributes = ["name"];
    @DatabaseField() name: String;
    @DatabaseField() boolProperty: boolean;
    @DatabaseField() override created: UpdateMetadata;
    @DatabaseField() override updated: UpdateMetadata;
    @DatabaseField() override inactive: boolean;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DuplicateRecordService,
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        EntitySchemaService,
        { provide: DefaultDatatype, useClass: DefaultDatatype, multi: true },
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        { provide: DefaultDatatype, useClass: BooleanDatatype, multi: true },
      ],
    });
    service = TestBed.inject(DuplicateRecordService);
    entityMapperService = TestBed.inject(EntityMapperService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
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
    const cloneSpy = spyOn(service, "clone").and.callThrough();
    const saveAllSpy = spyOn(entityMapperService, "saveAll");

    await service.duplicateRecord(originalData);

    expect(cloneSpy).toHaveBeenCalledWith(originalData);
    expect(saveAllSpy).toHaveBeenCalled();
  });
});
