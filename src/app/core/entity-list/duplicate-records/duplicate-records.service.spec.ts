import { TestBed } from "@angular/core/testing";
import { DuplicateRecordService } from "./duplicate-records.service";
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
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";

describe("DuplicateRecordsService", () => {
  let service: DuplicateRecordService;
  let entityMapperService: EntityMapperService;

  let mockAuthService: jasmine.SpyObj<KeycloakAuthService>;

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
      imports: [CoreModule],
      providers: [
        DuplicateRecordService,
        Database,
        EntityMapperService,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: {} },
        { provide: FileService, useValue: {} },
        { provide: KeycloakAuthService, useValue: mockAuthService },
        ComponentRegistry,
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
