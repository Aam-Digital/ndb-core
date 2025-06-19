import { TestBed } from "@angular/core/testing";

import { BackupService } from "./backup.service";
import { PouchDatabase } from "../../database/pouchdb/pouch-database";
import { DownloadService } from "../../export/download-service/download.service";
import { DataTransformationService } from "../../export/data-transformation-service/data-transformation.service";
import { MemoryPouchDatabase } from "../../database/pouchdb/memory-pouch-database";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { SyncStateSubject } from "app/core/session/session-type";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { LOCATION_TOKEN, WINDOW_TOKEN } from "../../../utils/di-tokens";

describe("BackupService", () => {
  let db: PouchDatabase;
  let service: BackupService;
  let syncStateSubject: SyncStateSubject;

  let mockWindow;

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    db = new MemoryPouchDatabase("unit-test-db", syncStateSubject);
    db.init();

    mockWindow = {
      indexedDB: {
        databases: jasmine.createSpy(),
        deleteDatabase: jasmine
          .createSpy()
          .and.callFake(() => new MockDeleteRequest()),
      },
      navigator: {
        serviceWorker: { getRegistrations: () => [], ready: Promise.resolve() },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        BackupService,
        DownloadService,
        { provide: DataTransformationService, useValue: {} },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => db },
        },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        { provide: LOCATION_TOKEN, useValue: {} },
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
    expect(resAfter).toBeEmpty();
  });

  it("getDatabaseExport should return all records", async () => {
    await db.put({ _id: "Test:1", test: 1 });
    await db.put({ _id: "Test:2", test: 2 });

    const res = await db.getAll();
    expect(res).toHaveSize(2);

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
    expect(originalData).toHaveSize(2);

    const backup = await service.getDatabaseExport();
    await service.clearDatabase();
    await service.restoreData(backup, true);

    const res = await db.getAll();
    expect(res).toHaveSize(2);
    expect(res.map(ignoreRevProperty))
      .withContext(
        "restored records not identical to original records (_rev ignored)",
      )
      .toEqual(originalData.map(ignoreRevProperty));
  });

  it("getDatabaseExport should contain an entry for every record", async () => {
    const x1 = { _id: "Test:1", test: 1 };
    const x2 = { _id: "Test:2", test: 2 };
    await db.put(x1);
    await db.put(x2);

    const res = await db.getAll();
    expect(res).toHaveSize(2);

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
    expect(res).toHaveSize(2);
    expect(res.map(ignoreRevProperty)).toEqual([
      { _id: "Test:1", test: 1 },
      { _id: "Test:2", test: 2 },
    ]);
  });

  it("restoreData should not add empty properties to records", async () => {
    const data = [{ _id: "Test:1", test: 1 }];
    await service.restoreData(data);

    const res = await db.getAll();
    expect(res).toHaveSize(1);
    expect(res[0].other)
      .withContext("empty property was added anyway")
      .toBeUndefined();
    expect(res.map(ignoreRevProperty)).toEqual([{ _id: "Test:1", test: 1 }]);
  });

  it("should reset the application after confirmation", async () => {
    const confirmationDialog = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialog, "getConfirmation").and.returnValue({
      afterClosed: () => of(true),
    } as any);
    localStorage.setItem("someItem", "someValue");
    const unregisterSpy = jasmine.createSpy();
    mockWindow.navigator.serviceWorker.getRegistrations = () => [
      { unregister: unregisterSpy },
    ];
    mockWindow.indexedDB.databases.and.resolveTo([
      { name: "db1" },
      { name: "db2" },
    ]);

    await service.resetApplication();

    expect(unregisterSpy).toHaveBeenCalled();
    expect(localStorage.getItem("someItem")).toBeNull();
    expect(TestBed.inject(LOCATION_TOKEN).pathname).toBe("");
    expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith("db1");
    expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith("db2");
  });

  function ignoreRevProperty(x) {
    delete x._rev;
    return x;
  }
});

class MockDeleteRequest {
  onsuccess: () => {};

  constructor() {
    setTimeout(() => this.onsuccess());
  }
}
