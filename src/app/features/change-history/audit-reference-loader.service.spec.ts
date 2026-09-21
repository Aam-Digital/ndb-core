import { TestBed } from "@angular/core/testing";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { AuditReferenceLoaderService } from "./audit-reference-loader.service";
import { ChangeHistoryService } from "./change-history.service";
import { AuditRecord } from "./model/audit-record";
import { Entity } from "../../core/entity/model/entity";

let loader: AuditReferenceLoaderService;
let queryReferenceView: ReturnType<typeof vi.fn>;

/** the view query of the last call */
function lastQuery(): Record<string, any> {
  return queryReferenceView.mock.calls.at(-1)[0];
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
  queryReferenceView = vi.fn().mockResolvedValue({ offset: 0, rows: [] });
  await TestBed.configureTestingModule({
    imports: [MockedTestingModule.withState()],
    providers: [
      { provide: ChangeHistoryService, useValue: { queryReferenceView } },
    ],
  }).compileComponents();
  loader = TestBed.inject(AuditReferenceLoaderService);
});

it("should start at the range start, not at a position", async () => {
  await loader.loadPage(forEntity, {}, { limit: 2 });

  expect(lastQuery().startkey).toEqual(["Entity:User:1", {}]);
  expect(lastQuery().skip).toBeUndefined();
  // the backend filters and pages a view response only when docs are included
  expect(lastQuery().include_docs).toBe(true);
  expect(lastQuery().limit).toBe(2);
});

it("should continue past everything already returned, not past the page size", async () => {
  // three rows were skipped over as denied, so the reported position ran ahead
  queryReferenceView.mockResolvedValue({
    offset: 3,
    rows: [{ doc: rawDoc() }, { doc: rawDoc("Child:2") }],
  });

  const first = await loader.loadPage(forEntity, {}, { limit: 2 });
  await loader.loadPage(forEntity, {}, { limit: 2, bookmark: first.bookmark });

  expect(first.bookmark).toBe("5");
  expect(lastQuery().skip).toBe(5);
  // a repeated range start would return the same rows again
  expect(lastQuery().startkey).toBeUndefined();
});

it("should drop rows the backend's permission filter emptied", async () => {
  queryReferenceView.mockResolvedValue({
    offset: 0,
    rows: [{ doc: rawDoc() }, {}],
  });

  const page = await loader.loadPage(forEntity, {}, { limit: 2 });

  expect(page.records.length).toBe(1);
  expect(page.records[0]).toBeInstanceOf(AuditRecord);
  expect(page.records[0].record).toBe("Child:1");
  // the dropped row still counts towards the position of the next one
  expect(page.bookmark).toBe("2");
});

it("should narrow the key range by the selected dates", async () => {
  await loader.loadPage(
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
