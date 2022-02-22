import { TestBed } from "@angular/core/testing";
import { DataImportService } from "./data-import.service";
import { PouchDatabase } from "../../core/database/pouch-database";
import { Database } from "../../core/database/database";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import {
  MatSnackBar,
  MatSnackBarModule,
  MatSnackBarRef,
} from "@angular/material/snack-bar";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { NEVER, of } from "rxjs";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { Papa, ParseResult } from "ngx-papaparse";
import { ImportMetaData } from "./import-meta-data.type";
import { expectEntitiesToBeInDatabase } from "../../utils/expect-entity-data.spec";
import { Child } from "../../child-dev-project/children/model/child";
import moment from "moment";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { QueryService } from "../reporting/query.service";

describe("DataImportService", () => {
  let db: PouchDatabase;
  let service: DataImportService;

  beforeEach(() => {
    db = PouchDatabase.createWithInMemoryDB();
    TestBed.configureTestingModule({
      imports: [MatDialogModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        DataImportService,
        {
          provide: Database,
          useValue: db,
        },
        { provide: QueryService, useValue: {} },
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

  it("should only allow files that have a .csv extension", async () => {
    mockFileReader();

    const file = { name: "wrong_extension.xlsx" };
    await expectAsync(service.validateCsvFile(file as File)).toBeRejected();

    file.name = "good_extension.csv";
    await expectAsync(service.validateCsvFile(file as File)).toBeResolved();
  });

  it("should throw error if file cannot be parsed", async () => {
    mockFileReader();
    const papa = TestBed.inject(Papa);
    spyOn(papa, "parse").and.returnValue(undefined);
    const file = { name: "file.csv" } as File;

    await expectAsync(service.validateCsvFile(file)).toBeRejected();
  });

  it("should throw error if file is empty", async () => {
    mockFileReader("");
    const file = { name: "file.csv" } as File;

    await expectAsync(service.validateCsvFile(file)).toBeRejected();
  });

  it("should restore database if snackbar is clicked", async () => {
    const doc1 = { _id: "Doc:1" };
    const doc2 = { _id: "Doc:2" };
    await db.put(doc1);
    await db.put(doc2);
    mockFileReader();
    mockDialog(true);
    mockSnackbar(true);
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: {
        _id: "_id",
        projectNumber: "projectNumber",
        name: "name",
      },
    };
    const file = { name: "some.csv" } as File;
    const parseResult = await service.validateCsvFile(file);

    await service.handleCsvImport(parseResult, importMeta);

    await expectAsync(db.get(doc1._id)).toBeResolved();
    await expectAsync(db.get(doc2._id)).toBeResolved();
    await expectAsync(db.get("Child:1")).toBeRejected();
  });

  it("should use the passed component map to create the entity", async () => {
    mockDialog();
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

  it("should delete existing records and set the transaction ID to the newly uploaded entities", async () => {
    mockDialog();
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
    const imported = await db.getAll(`Child:${transactionID}`);
    expect(imported).toHaveSize(2);
    const ids = imported.map((doc) => doc._id as string);
    ids.forEach((id) =>
      expect(id.startsWith(`Child:${transactionID}`)).toBeTrue()
    );
  });

  it("should use the provided date format to parse dates", async () => {
    mockDialog();
    const csvData = {
      meta: { fields: ["ID", "Birthday"] },
      data: [
        { ID: "test1", Birthday: "17/12/2010" },
        { ID: "test2", Birthday: "7/6/2011" },
      ],
    } as ParseResult;
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: { ID: "_id", Birthday: "dateOfBirth" },
      dateFormat: "D/M/YYYY",
    };

    await service.handleCsvImport(csvData, importMeta);

    const entityMapper = TestBed.inject(EntityMapperService);
    const test1 = await entityMapper.load(Child, "test1");
    expect(test1.dateOfBirth).toEqual(new Date("2010-12-17"));
    const test2 = await entityMapper.load(Child, "test2");
    expect(test2.dateOfBirth).toEqual(new Date("2011-06-07"));
  });

  function mockFileReader(
    result = '_id,name,projectNumber\nChild:1,"John Doe",123'
  ) {
    const fileReader: any = {
      result: result,
      addEventListener: (str: string, fun: () => any) => fun(),
      readAsText: () => {},
    };
    // mock FileReader constructor
    spyOn(window, "FileReader").and.returnValue(fileReader);
    return fileReader;
  }

  function mockDialog(
    confirm: boolean = true
  ): jasmine.SpyObj<MatDialogRef<any>> {
    const mockDialogRef = jasmine.createSpyObj<MatDialogRef<any>>(
      "mockDialogRef",
      ["afterClosed"]
    );
    mockDialogRef.afterClosed.and.returnValue(of(confirm));
    const confirmationDialog = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialog, "openDialog").and.returnValue(mockDialogRef);
    return mockDialogRef;
  }

  function mockSnackbar(clicked: boolean): jasmine.SpyObj<MatSnackBarRef<any>> {
    const mockSnackBarRef = jasmine.createSpyObj<MatSnackBarRef<any>>(
      "mockSnackBarRef",
      ["onAction"]
    );
    if (clicked) {
      mockSnackBarRef.onAction.and.returnValue(of(null));
    } else {
      mockSnackBarRef.onAction.and.returnValue(NEVER);
    }
    const snackBar = TestBed.inject(MatSnackBar);
    spyOn(snackBar, "open").and.returnValue(mockSnackBarRef);
    return mockSnackBarRef;
  }
});
