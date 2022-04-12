import { TestBed } from "@angular/core/testing";

import { BackupService } from "./backup.service";
import { Database } from "../../database/database";
import { PouchDatabase } from "../../database/pouch-database";
import { ExportService } from "../../export/export-service/export.service";
import { QueryService } from "../../../features/reporting/query.service";

describe("BackupService", () => {
  let db: PouchDatabase;
  let service: BackupService;

  beforeEach(() => {
    db = PouchDatabase.create();
    TestBed.configureTestingModule({
      providers: [
        BackupService,
        ExportService,
        { provide: QueryService, useValue: { queryData: () => [] } },
        { provide: Database, useValue: db },
      ],
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

    expect(jsonExport).toBe(
      `[{"test":1,"_id":"Test:1","_rev":"${res[0]._rev}"},{"test":2,"_id":"Test:2","_rev":"${res[1]._rev}"}]`
    );
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
    expect(res.map(ignoreRevProperty))
      .withContext(
        "restored records not identical to original records (_rev ignored)"
      )
      .toEqual(originalData.map(ignoreRevProperty));
  });

  it("getCsvExport should contain a line for every record", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const res = await db.getAll();
    expect(res.length).toBe(2);

    const csvExport = await service.getCsvExport();

    expect(csvExport.split(ExportService.SEPARATOR_ROW)).toHaveSize(2 + 1); // includes 1 header line
  });

  it("importCsv should add records", async () => {
    const csv =
      "_id" +
      ExportService.SEPARATOR_COL +
      "test" +
      ExportService.SEPARATOR_ROW +
      '"Test:1"' +
      ExportService.SEPARATOR_COL +
      "1" +
      ExportService.SEPARATOR_ROW +
      '"Test:2"' +
      ExportService.SEPARATOR_COL +
      "2" +
      ExportService.SEPARATOR_ROW;

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
      ExportService.SEPARATOR_COL +
      "other" +
      ExportService.SEPARATOR_COL +
      "test" +
      ExportService.SEPARATOR_ROW +
      '"Test:1"' +
      ExportService.SEPARATOR_COL +
      ExportService.SEPARATOR_COL +
      "1";

    await service.importCsv(csv);

    const res = await db.getAll();
    expect(res).toHaveSize(1);
    expect(res[0].other)
      .withContext("empty property was added anyway")
      .toBeUndefined();
    expect(res.map(ignoreRevProperty)).toEqual([{ _id: "Test:1", test: 1 }]);
  });

  function ignoreRevProperty(x) {
    delete x._rev;
    return x;
  }
});
