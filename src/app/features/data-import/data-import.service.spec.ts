import { TestBed } from "@angular/core/testing";
import { DataImportService } from "./data-import.service";
import { PouchDatabase } from "../../core/database/pouch-database";
import { Database } from "../../core/database/database";
import { BackupService } from "../../core/admin/services/backup.service";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { of } from "rxjs";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { ParseResult } from "ngx-papaparse";
import { ImportMetaData } from "./import-meta-data.type";
import { expectEntitiesToBeInDatabase } from "../../utils/expect-entity-data.spec";
import { Child } from "../../child-dev-project/children/model/child";
import moment from "moment";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("DataImportService", () => {
  let db: PouchDatabase;
  let service: DataImportService;
  let mockBackupService: jasmine.SpyObj<BackupService>;

  // function createFileReaderMock(result: string = "") {
  //   const mockFileReader: any = {
  //     result: result,
  //     addEventListener: (str: string, fun: () => any) => fun(),
  //     readAsText: () => {},
  //   };
  //   spyOn(mockFileReader, "readAsText");
  //   // mock FileReader constructor
  //   spyOn(window, "FileReader").and.returnValue(mockFileReader);
  //   return mockFileReader;
  // }
  //
  function confirmDialog(
    confirm: boolean = true
  ): jasmine.SpyObj<MatDialogRef<any>> {
    const mockDialogRef = jasmine.createSpyObj<MatDialogRef<any>>(
      "mockDialogRef",
      ["afterClosed"]
    );
    mockDialogRef.afterClosed.and.returnValue(of(confirm));
    spyOn(
      TestBed.inject(ConfirmationDialogService),
      "openDialog"
    ).and.returnValue(mockDialogRef);
    return mockDialogRef;
  }
  //
  // function createSnackBarMock(
  //   clicked: boolean
  // ): jasmine.SpyObj<MatSnackBarRef<any>> {
  //   const mockSnackBarRef = jasmine.createSpyObj<MatSnackBarRef<any>>(
  //     "mockSnackBarRef",
  //     ["onAction"]
  //   );
  //   if (clicked) {
  //     mockSnackBarRef.onAction.and.returnValue(of(null));
  //   } else {
  //     mockSnackBarRef.onAction.and.returnValue(of());
  //   }
  //   mockSnackBar.open.and.returnValue(mockSnackBarRef);
  //   return mockSnackBarRef;
  // }

  beforeEach(() => {
    db = PouchDatabase.createWithInMemoryDB();
    mockBackupService = jasmine.createSpyObj(["getJsonExport"]);
    TestBed.configureTestingModule({
      imports: [MatDialogModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        DataImportService,
        {
          provide: Database,
          useValue: db,
        },
        {
          provide: BackupService,
          useValue: mockBackupService,
        },
        ConfirmationDialogService,
        EntityMapperService,
        EntitySchemaService,
      ],
    });
    service = TestBed.inject(DataImportService);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
  //
  // it("should open dialog and call backup service and data-import service when loading csv", fakeAsync(() => {
  //   const mockFileReader = createFileReaderMock();
  //   mockBackupService.getJsonExport.and.resolveTo(null);
  //   createDialogMock(true);
  //   createSnackBarMock(false);
  //   spyOn(service, "importCsvContentToDB");
  //
  //   service.handleCsvImport(null, {
  //     entityType: "Child",
  //     transactionId: "a1b2c3d4",
  //   });
  //
  //   expect(mockBackupService.getJsonExport).toHaveBeenCalled();
  //   tick();
  //   expect(mockFileReader.readAsText).toHaveBeenCalled();
  //   expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
  //   flush();
  //   expect(service.importCsvContentToDB).toHaveBeenCalled();
  // }));
  //
  // it("should open dialog and abort data-import when cancelled", fakeAsync(() => {
  //   const mockFileReader = createFileReaderMock();
  //   mockBackupService.getJsonExport.and.resolveTo(null);
  //   createDialogMock(false);
  //   spyOn(service, "importCsvContentToDB");
  //
  //   service.handleCsvImport(null, {
  //     entityType: "Child",
  //     transactionId: "a1b2c3d4",
  //   });
  //
  //   expect(mockBackupService.getJsonExport).toHaveBeenCalled();
  //   tick();
  //   expect(mockFileReader.readAsText).toHaveBeenCalled();
  //   expect(confirmationDialogMock.openDialog).toHaveBeenCalled();
  //   flush();
  //   expect(service.importCsvContentToDB).not.toHaveBeenCalled();
  // }));
  //
  // it("should restore database when undo button is clicked", fakeAsync(() => {
  //   createFileReaderMock();
  //   mockBackupService.getJsonExport.and.resolveTo("mockRestorePoint");
  //   mockBackupService.clearDatabase.and.resolveTo();
  //   createDialogMock(true);
  //   createSnackBarMock(true);
  //   spyOn(db, "getAll").and.resolveTo([]);
  //
  //   service.handleCsvImport(null, {
  //     entityType: "Child",
  //     transactionId: "a1b2c3d4",
  //   });
  //
  //   tick();
  //   expect(mockBackupService.clearDatabase).toHaveBeenCalled();
  //   expect(mockBackupService.importJson).toHaveBeenCalledWith(
  //     "mockRestorePoint",
  //     true
  //   );
  //   flush();
  // }));
  //
  // it("should import csv file and generate searchIndices", async () => {
  //   const csvString = "_id,name,projectNumber\n" + 'Child:1,"John Doe",123';
  //
  //   await service.importCsvContentToDB(csvString, {
  //     entityType: "Child",
  //     transactionId: "transactionID",
  //   });
  //
  //   expect(db.put).toHaveBeenCalledWith(
  //     jasmine.objectContaining({
  //       searchIndices: ["John", "Doe", 123],
  //     }),
  //     jasmine.anything()
  //   );
  // });
  //
  // it("should validate csv with matching _id and content", async () => {
  //   const mockFileReader = createFileReaderMock("_id,value\nChild:123,123");
  //   const valResult = await service.validateCsvFile(null, "Child");
  //
  //   expect(mockFileReader.readAsText).toHaveBeenCalled();
  //   expect(valResult.status).toEqual(CsvValidationStatus.Valid);
  // });
  //
  // it("should validate csv without _id", async () => {
  //   const mockFileReader = createFileReaderMock("value\n123");
  //   const valResult = await service.validateCsvFile(null, "Child");
  //
  //   expect(mockFileReader.readAsText).toHaveBeenCalled();
  //   expect(valResult.status).toEqual(CsvValidationStatus.Valid);
  // });
  //
  // it("should reject csv when _id and content don't match", async () => {
  //   const mockFileReader = createFileReaderMock("_id,value\nNotAChild:123,123");
  //   const valResult = await service.validateCsvFile(null, "Child");
  //
  //   expect(mockFileReader.readAsText).toHaveBeenCalled();
  //   expect(valResult.status).toEqual(CsvValidationStatus.ErrorWrongType);
  // });
  //
  // it("should reject empty csv file", async () => {
  //   const mockFileReader = createFileReaderMock("_id,value");
  //   const valResult = await service.validateCsvFile(null, "Child");
  //
  //   expect(mockFileReader.readAsText).toHaveBeenCalled();
  //   expect(valResult.status).toEqual(CsvValidationStatus.ErrorEmpty);
  // });
  //
  // it("should reject empty csv without _id", async () => {
  //   const mockFileReader = createFileReaderMock("value");
  //   const valResult = await service.validateCsvFile(null, "Child");
  //
  //   expect(mockFileReader.readAsText).toHaveBeenCalled();
  //   expect(valResult.status).toEqual(CsvValidationStatus.ErrorEmpty);
  // });
  //
  // it("should reject invalid csv", async () => {
  //   // I'm unable to break the csv import
  // });

  it("should use the passed component map to create the entity", async () => {
    confirmDialog();
    const birthday1 = moment().subtract("10", "years");
    const birthday2 = moment().subtract("12", "years");
    const csvData = {
      meta: { fields: ["ID", "Name", "Birthday", "Age"] },
      data: [
        {
          ID: 1,
          Name: "First",
          Birthday: birthday1.format("YYYY-MM-DD"),
          age: "6",
        },
        {
          ID: 2,
          Name: "Second",
          Birthday: birthday2.format("YYYY-MM-DD"),
          age: "7",
        },
      ],
    } as ParseResult;
    const columnMap = {
      ID: "_id",
      Name: "name",
      Birthday: "dateOfBirth",
      age: "",
    };
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: columnMap,
    };

    await service.handleCsvImport(csvData, importMeta);

    const entityMapper = TestBed.inject(EntityMapperService);
    const firstChild = await entityMapper.load(Child, "1");
    expect(firstChild._id).toBe("Child:1");
    expect(firstChild.name).toBe("First");
    expect(birthday1.isSame(firstChild.dateOfBirth, "day")).toBeTrue();
    expect(firstChild.age).toBe(10);
    const secondChild = await entityMapper.load(Child, "2");
    expect(secondChild._id).toBe("Child:2");
    expect(secondChild.name).toBe("Second");
    expect(birthday2.isSame(secondChild.dateOfBirth, "day")).toBeTrue();
    expect(secondChild.age).toBe(12);
  });

  it("should delete existing records and set a fallback _id if a transactionID is provided", async () => {
    confirmDialog();
    const csvData = {
      meta: { fields: ["Name"] },
      data: [{ Name: "test1" }, { Name: "test2" }],
    } as ParseResult;
    const transactionID = "12345678";
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: { Name: "name" },
      transactionId: transactionID,
    };
    await db.put({ _id: `Child:${transactionID}-123` });
    await db.put({ _id: `Child:${transactionID}-124` });

    await service.handleCsvImport(csvData, importMeta);

    await expectEntitiesToBeInDatabase(
      [Child.create("test1"), Child.create("test2")],
      true,
      true
    );
  });
});
