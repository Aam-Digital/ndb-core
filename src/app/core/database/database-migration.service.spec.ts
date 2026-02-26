import { TestBed } from "@angular/core/testing";
import { DatabaseMigrationService } from "./database-migration.service";
import { MemoryPouchDatabase } from "./pouchdb/memory-pouch-database";
import { SyncStateSubject } from "#src/app/core/session/session-type";

describe("DatabaseMigrationService", () => {
  let db: MemoryPouchDatabase;
  let service: DatabaseMigrationService;

  beforeEach(() => {
    const syncState = new SyncStateSubject();
    db = new MemoryPouchDatabase("unit-test-migration-db", syncState);
    db.init();

    TestBed.configureTestingModule({
      providers: [DatabaseMigrationService],
    });

    service = TestBed.inject(DatabaseMigrationService);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("should migrate Note documents with childrenAttendance to attendance", async () => {
    await db.put({
      _id: "Note:abc",
      subject: "Meeting",
      childrenAttendance: [
        ["Child:112", { status: "PRESENT", remarks: "" }],
        ["Child:113", { status: "ABSENT", remarks: "sick" }],
      ],
    });

    await service.applyMigrations(db);

    const migratedDoc = await db.get("Note:abc");
    expect(migratedDoc.attendance).toEqual([
      { participant: "Child:112", status: "PRESENT", remarks: "" },
      { participant: "Child:113", status: "ABSENT", remarks: "sick" },
    ]);
    expect(migratedDoc.childrenAttendance).toBeUndefined();
  });

  it("should skip documents that do not require migration", async () => {
    await db.put({
      _id: "Note:already",
      attendance: [
        { participant: "Child:112", status: "PRESENT", remarks: "" },
      ],
    });

    await service.applyMigrations(db);

    const doc = await db.get("Note:already");
    expect(doc.attendance).toEqual([
      { participant: "Child:112", status: "PRESENT", remarks: "" },
    ]);
    expect(doc.childrenAttendance).toBeUndefined();
  });

  it("should migrate multiple documents in one pass", async () => {
    await db.put({
      _id: "Note:1",
      childrenAttendance: [["Child:112", { status: "PRESENT", remarks: "" }]],
    });
    await db.put({
      _id: "Note:2",
      childrenAttendance: [["Child:113", { status: "ABSENT", remarks: "" }]],
    });

    await service.applyMigrations(db);

    const doc1 = await db.get("Note:1");
    const doc2 = await db.get("Note:2");
    expect(doc1.attendance[0].participant).toBe("Child:112");
    expect(doc2.attendance[0].participant).toBe("Child:113");
  });

  it("should not modify non-Note documents", async () => {
    await db.put({
      _id: "Child:999",
      name: "Test",
    });

    await service.applyMigrations(db);

    const doc = await db.get("Child:999");
    expect(doc.attendance).toBeUndefined();
  });

  it("should do nothing when there are no documents to migrate", async () => {
    await expectAsync(service.applyMigrations(db)).toBeResolved();
  });

  it("should be idempotent when run twice", async () => {
    await db.put({
      _id: "Note:abc",
      childrenAttendance: [["Child:112", { status: "PRESENT", remarks: "" }]],
    });

    await service.applyMigrations(db);
    await service.applyMigrations(db);

    const doc = await db.get("Note:abc");
    expect(doc.attendance).toHaveSize(1);
    expect(doc.childrenAttendance).toBeUndefined();
  });
});
