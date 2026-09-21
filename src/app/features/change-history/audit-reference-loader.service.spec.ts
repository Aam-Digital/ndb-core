import { TestBed } from "@angular/core/testing";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { AuditReferenceLoaderService } from "./audit-reference-loader.service";
import { AuditRecord } from "./model/audit-record";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";

let loader: AuditReferenceLoaderService;
let indexing: {
  createIndex: ReturnType<typeof vi.fn>;
  queryIndexRaw: ReturnType<typeof vi.fn>;
};

/** the view query of the last call */
function lastQuery(): Record<string, any> {
  return indexing.queryIndexRaw.mock.calls.at(-1)[1];
}

function rawDoc(id = "Child:1"): any {
  return {
    _id: `AuditRecord:${id}:2026-06-03T10:00:00.000Z:2-abc`,
    entityId: id,
    operation: "update",
    timestamp: "2026-06-03T10:00:00.000Z",
    user: { name: "demo" },
    diff: { name: ["A", "B"] },
  };
}

const forEntity = new Entity("User:1");

beforeEach(async () => {
  indexing = {
    createIndex: vi.fn().mockResolvedValue(undefined),
    queryIndexRaw: vi.fn().mockResolvedValue({ offset: 0, rows: [] }),
  };
  await TestBed.configureTestingModule({
    imports: [MockedTestingModule.withState()],
    providers: [{ provide: DatabaseIndexingService, useValue: indexing }],
  }).compileComponents();
  loader = TestBed.inject(AuditReferenceLoaderService);
});

it("should query the audit database rather than the app database", async () => {
  await loader.loadPageFor(forEntity, {}, { limit: 2 });

  expect(indexing.createIndex).toHaveBeenCalledWith(
    expect.anything(),
    AuditRecord.DATABASE,
  );
  expect(indexing.queryIndexRaw.mock.calls.at(-1)[3]).toBe(
    AuditRecord.DATABASE,
  );
});

it("should still query when the view cannot be created", async () => {
  // reading a view needs less permission than writing its design document,
  // and it may well exist already from an earlier session or another admin
  indexing.createIndex.mockRejectedValue(new Error("forbidden"));

  await loader.loadPageFor(forEntity, {}, { limit: 2 });

  expect(indexing.queryIndexRaw).toHaveBeenCalled();
});

it("should start at the range start, not at a position", async () => {
  await loader.loadPageFor(forEntity, {}, { limit: 2 });

  expect(lastQuery().startkey).toEqual(["Entity:User:1", {}]);
  expect(lastQuery().skip).toBeUndefined();
  // the backend filters and pages a view response only when docs are included
  expect(lastQuery().include_docs).toBe(true);
  expect(lastQuery().limit).toBe(2);
});

it("should continue past everything already returned, not past the page size", async () => {
  // three rows were skipped over as denied, so the reported position ran ahead
  indexing.queryIndexRaw.mockResolvedValue({
    offset: 3,
    rows: [{ doc: rawDoc() }, { doc: rawDoc("Child:2") }],
  });

  const first = await loader.loadPageFor(forEntity, {}, { limit: 2 });
  await loader.loadPageFor(
    forEntity,
    {},
    {
      limit: 2,
      bookmark: first.bookmark,
    },
  );

  expect(first.bookmark).toBe("5");
  expect(lastQuery().skip).toBe(5);
  // a repeated range start would return the same rows again
  expect(lastQuery().startkey).toBeUndefined();
});

it("should drop rows the backend's permission filter emptied", async () => {
  indexing.queryIndexRaw.mockResolvedValue({
    offset: 0,
    rows: [{ doc: rawDoc() }, {}],
  });

  const page = await loader.loadPageFor(forEntity, {}, { limit: 2 });

  expect(page.records.length).toBe(1);
  expect(page.records[0]).toBeInstanceOf(AuditRecord);
  expect(page.records[0].record).toBe("Child:1");
  // the dropped row still counts towards the position of the next one
  expect(page.bookmark).toBe("2");
});

it("should narrow the key range by the selected dates", async () => {
  await loader.loadPageFor(
    forEntity,
    {
      timestamp: {
        $gte: "2026-06-01T00:00:00.000Z",
        $lte: "2026-06-30T23:59:59.999Z",
      },
    } as any,
    { limit: 2 },
  );

  // descending, so the newer bound opens the range and the older one closes it
  expect(lastQuery().endkey).toEqual([
    "Entity:User:1",
    "2026-06-01T00:00:00.000Z",
  ]);
  expect(lastQuery().startkey).toEqual([
    "Entity:User:1",
    "2026-06-30T23:59:59.999Z",
  ]);
});
