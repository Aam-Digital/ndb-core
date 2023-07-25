import { TestBed, waitForAsync } from "@angular/core/testing";
import { DataImportService } from "./data-import.service";
import { Database } from "../../core/database/database";
import { ConfirmationDialogService } from "../../core/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar, MatSnackBarRef } from "@angular/material/snack-bar";
import { NEVER, of } from "rxjs";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ImportMetaData } from "./import-meta-data.type";
import { expectEntitiesToBeInDatabase } from "../../utils/expect-entity-data.spec";
import { Child } from "../../child-dev-project/children/model/child";
import moment from "moment";
import { DatabaseTestingModule } from "../../utils/database-testing.module";
import { Note } from "../../child-dev-project/notes/model/note";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";

describe("DataImportService", () => {
  let db: Database;
  let service: DataImportService;
  let entityMapper: EntityMapperService;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(waitForAsync(() => {
    mockConfirmationService = jasmine.createSpyObj(["getConfirmation"]);
    mockConfirmationService.getConfirmation.and.resolveTo(true);
    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationService,
        },
      ],
    });
    service = TestBed.inject(DataImportService);
    db = TestBed.inject(Database);
    entityMapper = TestBed.inject(EntityMapperService);
  }));

  afterEach(() => db.destroy());

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should restore database if snackbar is clicked", async () => {
    const doc1 = { _id: "Doc:1" };
    const doc2 = { _id: "Doc:2" };
    await db.put(doc1);
    await db.put(doc2);
    mockSnackbar(true);
    const data = [
      {
        _id: "Child:1",
        name: "First",
      },
    ];
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: {
        _id: { label: "_id", key: "_id" },
        name: { label: "Name", key: "name" },
      },
    };

    await service.handleCsvImport(data, importMeta);

    await expectAsync(db.get(doc1._id)).toBeResolved();
    await expectAsync(db.get(doc2._id)).toBeResolved();
    await expectAsync(db.get("Child:1")).toBeRejected();
  });

  it("should use the passed component map to create the entity", async () => {
    const date1 = moment().subtract("10", "years");
    const date2 = moment().subtract("12", "years");
    const data = [
      {
        ID: 1,
        Name: "First",
        Birthday: date1.format("YYYY-MM-DD"),
        notExistingProperty: "some value",
      },
      {
        ID: 2,
        Name: "Second",
        Birthday: date2.format("YYYY-MM-DD"),
        notExistingProperty: "another value",
      },
    ];
    const columnMap = {
      ID: { key: "_id", label: "_id" },
      Name: { key: "name", label: "Name" },
      Birthday: { key: "dateOfBirth", label: "Date of birth" },
      notExistingProperty: undefined,
    };
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: columnMap,
    };

    await service.handleCsvImport(data, importMeta);

    const firstChild = await entityMapper.load(Child, "1");
    expect(firstChild.getId(true)).toBe("Child:1");
    expect(firstChild.name).toBe("First");
    expect(date1.isSame(firstChild.dateOfBirth, "day")).toBeTrue();
    expect(firstChild.dateOfBirth.age).toBe(10);
    expect(firstChild).not.toHaveOwnProperty("notExistingProperty");
    const secondChild = await entityMapper.load(Child, "2");
    expect(secondChild.getId(true)).toBe("Child:2");
    expect(secondChild.name).toBe("Second");
    expect(date2.isSame(secondChild.dateOfBirth, "day")).toBeTrue();
    expect(secondChild.dateOfBirth.age).toBe(12);
    expect(secondChild).not.toHaveOwnProperty("notExistingProperty");
  });

  it("should delete existing records and prepend the transactionID to ID's of the newly uploaded entities", async () => {
    const data = [{ Name: "test1" }, { Name: "test2" }];
    const transactionID = "12345678";
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: { Name: { key: "name", label: "Name" } },
      transactionId: transactionID,
    };
    await db.put({ _id: `Child:${transactionID}-123` });
    await db.put({ _id: `Child:${transactionID}-124` });

    await service.handleCsvImport(data, importMeta);

    await expectEntitiesToBeInDatabase(
      [Child.create("test1"), Child.create("test2")],
      true,
      true,
    );
    const imported = await db.getAll(`Child:${transactionID}`);
    expect(imported).toHaveSize(2);
    const ids = imported.map((doc) => doc._id as string);
    ids.forEach((id) =>
      expect(id.startsWith(`Child:${transactionID}`)).toBeTrue(),
    );
  });

  it("should use the provided date format to parse dates", async () => {
    const data = [
      { ID: "test1", Birthday: "17/12/2010" },
      { ID: "test2", Birthday: "7/6/2011" },
    ];
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: {
        ID: { key: "_id", label: "_id" },
        Birthday: { key: "dateOfBirth", label: "Date of birth" },
      },
      dateFormat: "D/M/YYYY",
    };

    await service.handleCsvImport(data, importMeta);

    const test1 = await entityMapper.load(Child, "test1");
    expect(test1.dateOfBirth).toBeDate("2010-12-17");
    const test2 = await entityMapper.load(Child, "test2");
    expect(test2.dateOfBirth).toBeDate("2011-06-07");
  });

  it("should save array strings as arrays", async () => {
    const data = [
      { ID: "1", children: '["one", "two"]' },
      { ID: "2", children: "two, three" },
      { ID: "3", children: "two" },
      { ID: "4", children: "" },
    ];
    const importMeta: ImportMetaData = {
      entityType: "Note",
      columnMap: {
        ID: { key: "_id", label: "_id" },
        subject: { key: "subject", label: "Subject" },
        children: { key: "children", label: "Children" },
      },
    };

    await service.handleCsvImport(data, importMeta);

    const note1 = await entityMapper.load(Note, "1");
    expect(note1.children).toEqual(["one", "two"]);
    const note2 = await entityMapper.load(Note, "2");
    expect(note2.children).toEqual(["two", "three"]);
    const note3 = await entityMapper.load(Note, "3");
    expect(note3.children).toEqual(["two"]);
    const note4 = await entityMapper.load(Note, "4");
    expect(note4.children).toEqual([]);
  });

  it("should create relations to the linked entities", async () => {
    const data = [{ ID: "1" }];
    const importMeta: ImportMetaData = {
      entityType: "Child",
      columnMap: {
        ID: { key: "_id", label: "_id" },
      },
      linkEntity: { type: "School", id: "schoolId" },
    };

    await service.handleCsvImport(data, importMeta);

    const relations = await entityMapper.loadType(ChildSchoolRelation);
    expect(relations).toHaveSize(1);
    expect(relations[0].childId).toBe("1");
    expect(relations[0].schoolId).toBe("schoolId");
    expect(relations[0].isActive).toBeTrue();

    let activity = new RecurringActivity();
    await entityMapper.save(activity);
    importMeta.linkEntity = {
      type: "RecurringActivity",
      id: activity.getId(),
    };

    await service.handleCsvImport(data, importMeta);

    activity = await entityMapper.load(RecurringActivity, activity.getId());
    expect(activity.participants).toEqual(["1"]);
  });

  function mockSnackbar(clicked: boolean): jasmine.SpyObj<MatSnackBarRef<any>> {
    const mockSnackBarRef = jasmine.createSpyObj<MatSnackBarRef<any>>(
      "mockSnackBarRef",
      ["onAction"],
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
