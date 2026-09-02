import { TestBed } from "@angular/core/testing";

import { BackupService } from "./backup.service";
import { PouchDatabase } from "../../database/pouchdb/pouch-database";
import { DownloadService } from "../../export/download-service/download.service";
import { DataTransformationService } from "../../export/data-transformation-service/data-transformation.service";
import { MemoryPouchDatabase } from "../../database/pouchdb/memory-pouch-database";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { SyncStateSubject } from "app/core/session/session-type";
// import the entity types used in the specs below, so that they are registered
import "../../config/config";

describe("BackupService", () => {
  let db: PouchDatabase;
  let service: BackupService;
  let syncStateSubject: SyncStateSubject;

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    db = new MemoryPouchDatabase("unit-test-db", syncStateSubject);
    db.init();

    TestBed.configureTestingModule({
      providers: [
        BackupService,
        DownloadService,
        { provide: DataTransformationService, useValue: {} },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => db },
        },
      ],
    });

    service = TestBed.inject<BackupService>(BackupService);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("clearDatabase should remove all records but the config", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Config:CONFIG_ENTITY", data: {} });

    await service.clearDatabase();

    const resAfter = await db.getAll();
    expect(resAfter.map((doc) => doc._id)).toEqual(["Config:CONFIG_ENTITY"]);
  });

  it("clearDatabase should remove database indices, which are part of the restored backup", async () => {
    await db.put({ _id: "_design/some_index", views: {} });

    await service.clearDatabase();

    expect(await db.getAll()).toEqual([]);
  });

  it("getDatabaseExport should return all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const res = await db.getAll();
    expect(res).toHaveLength(2);

    const result = await service.getDatabaseExport();

    expect(result).toEqual([
      { test: 1, _id: "Test:1", _rev: res[0]._rev },
      { test: 2, _id: "Test:2", _rev: res[1]._rev },
    ]);
  });

  it("getDatabaseExport | clearDatabase | restoreData should restore all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const originalData = await db.getAll();
    expect(originalData).toHaveLength(2);

    const backup = await service.getDatabaseExport();
    await service.clearDatabase();
    await service.restoreData(backup, true);

    const res = await db.getAll();
    expect(res).toHaveLength(2);
    expect(
      res.map(ignoreRevProperty),
      "restored records not identical to original records (_rev ignored)",
    ).toEqual(originalData.map(ignoreRevProperty));
  });

  it("getDatabaseExport should contain an entry for every record", async () => {
    const x1 = { _id: "Test:1", test: 1 };
    const x2 = { _id: "Test:2", test: 2 };
    await db.put(x1);
    await db.put(x2);

    const res = await db.getAll();
    expect(res).toHaveLength(2);

    const result = await service.getDatabaseExport();

    expect(result.map(ignoreRevProperty)).toEqual([x1, x2]);
  });

  it("importCsv should add records", async () => {
    const data = [
      { _id: "Test:1", test: 1 },
      { _id: "Test:2", test: 2 },
    ];
    await service.restoreData(data, true);
    const res = await db.getAll();
    expect(res).toHaveLength(2);
    expect(res.map(ignoreRevProperty)).toEqual([
      { _id: "Test:1", test: 1 },
      { _id: "Test:2", test: 2 },
    ]);
  });

  it("restoreData should not add empty properties to records", async () => {
    const data = [{ _id: "Test:1", test: 1 }];
    await service.restoreData(data);

    const res = await db.getAll();
    expect(res).toHaveLength(1);
    expect(res[0].other, "empty property was added anyway").toBeUndefined();
    expect(res.map(ignoreRevProperty)).toEqual([{ _id: "Test:1", test: 1 }]);
  });

  function ignoreRevProperty(x) {
    delete x._rev;
    return x;
  }
});
