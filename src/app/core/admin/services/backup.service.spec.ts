import { TestBed } from "@angular/core/testing";

import { BackupService } from "./backup.service";
import { Database } from "../../database/database";
import { PouchDatabase } from "../../database/pouch-database";

describe("BackupService", () => {
  let db: PouchDatabase;
  let service: BackupService;

  beforeEach(() => {
    db = PouchDatabase.createWithInMemoryDB();
    TestBed.configureTestingModule({
      providers: [BackupService, { provide: Database, useValue: db }],
    });

    service = TestBed.inject<BackupService>(BackupService);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("clearDatabase should remove all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });

    const res = await db.getAll();
    expect(res).toHaveSize(1);

    await service.clearDatabase();

    const resAfter = await db.getAll();
    expect(resAfter).toHaveSize(0);
  });

  it("getJsonExport should return all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const res = await db.getAll();
    expect(res).toHaveSize(2);

    const jsonExport = await service.getJsonExport();

    expect(jsonExport.split(BackupService.SEPARATOR_ROW)).toHaveSize(2);
  });

  it("getJsonExport | clearDatabase | importJson should restore all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const originalData = await db.getAll();
    expect(originalData).toHaveSize(2);

    const backup = await service.getJsonExport();
    await service.clearDatabase();
    await service.importJson(backup, true);

    const res = await db.getAll();
    expect(res).toHaveSize(2);
    expect(res.map(ignoreRevProperty)).toEqual(
      originalData.map(ignoreRevProperty),
      "restored records not identical to original records (_rev ignored)"
    );
  });

  it("getCsvExport should contain a line for every record", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const res = await db.getAll();
    expect(res.length).toBe(2);

    const csvExport = await service.getCsvExport();

    expect(csvExport.split(BackupService.SEPARATOR_ROW)).toHaveSize(2 + 1); // includes 1 header line
  });

  it("getCsvExport should contain a column for every property", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", other: 2 });
    const res = await db.getAll();
    expect(res).toHaveSize(2);

    const csvExport = await service.getCsvExport();

    const rows = csvExport.split(BackupService.SEPARATOR_ROW);
    expect(rows).toHaveSize(2 + 1); // includes 1 header line
    expect(rows[0].split(BackupService.SEPARATOR_COL)).toHaveSize(3 + 1); // includes _rev
  });

  it("importCsv should add records", async () => {
    const csv =
      "_id" +
      BackupService.SEPARATOR_COL +
      "test" +
      BackupService.SEPARATOR_ROW +
      '"Test:1"' +
      BackupService.SEPARATOR_COL +
      "1" +
      BackupService.SEPARATOR_ROW +
      '"Test:2"' +
      BackupService.SEPARATOR_COL +
      "2" +
      BackupService.SEPARATOR_ROW;

    await service.importCsv(csv, true);

    const res = await db.getAll();
    expect(res).toHaveSize(2);
    expect(res.map(ignoreRevProperty)).toEqual([
      { _id: "Test:1", test: 1 },
      { _id: "Test:2", test: 2 },
    ]);
  });

  it("importCsv should not add empty properties to records", async () => {
    const csv =
      "_id" +
      BackupService.SEPARATOR_COL +
      "other" +
      BackupService.SEPARATOR_COL +
      "test" +
      BackupService.SEPARATOR_ROW +
      '"Test:1"' +
      BackupService.SEPARATOR_COL +
      BackupService.SEPARATOR_COL +
      "1";

    await service.importCsv(csv);

    const res = await db.getAll();
    expect(res).toHaveSize(1);
    expect(res[0].other).toBeUndefined("empty property was added anyway");
    expect(res.map(ignoreRevProperty)).toEqual([{ _id: "Test:1", test: 1 }]);
  });

  function ignoreRevProperty(x) {
    delete x._rev;
    return x;
  }
});
