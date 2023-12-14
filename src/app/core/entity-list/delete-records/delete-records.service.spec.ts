import { TestBed } from "@angular/core/testing";
import { DeleteRecordService } from "./delete-records.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";
import { Database } from "../../database/database";
import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { CoreModule } from "../../core.module";
import { ComponentRegistry } from "../../../dynamic-components";
import { UpdateMetadata } from "../../entity/model/update-metadata";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FileService } from "../../../features/file/file.service";

describe("DeleteRecordsService", () => {
  let service: DeleteRecordService;
  let entityMapperService: EntityMapperService;

  @DatabaseEntity("DeleteTestEntity")
  class DeleteTestEntity extends Entity {
    static toStringAttributes = ["name"];
    @DatabaseField() name: String;
    @DatabaseField() boolProperty: boolean;
    @DatabaseField() created: UpdateMetadata;
    @DatabaseField() updated: UpdateMetadata;
    @DatabaseField() inactive: boolean;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [
        DeleteRecordService,
        Database,
        EntityMapperService,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: {} },
        { provide: FileService, useValue: {} },
        ComponentRegistry,
      ],
    });
    service = TestBed.inject(DeleteRecordService);
    entityMapperService = TestBed.inject(EntityMapperService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should transform data correctly", () => {
    const deleteTest = new DeleteTestEntity();
    deleteTest.name = "TestName";
    deleteTest.boolProperty = true;

    const originalData = [deleteTest];
    const transformedData = service.delete(originalData);

    expect(transformedData[0]).toBeInstanceOf(Entity);
    expect(transformedData[0]._id).toBeDefined();
    expect(transformedData[0]._id).not.toBe(deleteTest["_id"]);
    expect(transformedData[0].name).toMatch(/^Copy of /);
    expect(transformedData[0].boolProperty).toBe(true);
  });

  it("should save delete record", async () => {
    const deleteTestEntity = new DeleteTestEntity();
    deleteTestEntity.name = "TestName";
    deleteTestEntity.boolProperty = true;
    deleteTestEntity.inactive = false;

    const originalData = [deleteTestEntity];
    const cloneSpy = spyOn(service, "clone").and.callThrough();
    const saveAllSpy = spyOn(entityMapperService, "saveAll");

    await service.deleteRecord(originalData);

    expect(cloneSpy).toHaveBeenCalledWith(originalData);
    expect(saveAllSpy).toHaveBeenCalled();
  });
});
