import { TestBed } from "@angular/core/testing";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { AuditDataSource } from "./audit-data-source";
import { ChangeHistoryService } from "./change-history.service";
import { AuditRecord } from "./model/audit-record";

let dataSource: AuditDataSource;
let queryReferenceView: ReturnType<typeof vi.fn>;
let findType: ReturnType<typeof vi.fn>;

/** the protected page fetch, which is what the cursor logic lives in */
function fetchPage(bookmark?: string, limit = 2) {
  return (dataSource as any).fetchPage({}, { limit, bookmark }, {});
}

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

beforeEach(async () => {
  queryReferenceView = vi.fn().mockResolvedValue({ offset: 0, rows: [] });
  findType = vi.fn().mockResolvedValue({ records: [], bookmark: "bm" });

  await TestBed.configureTestingModule({
    imports: [MockedTestingModule.withState()],
    providers: [
      { provide: ChangeHistoryService, useValue: { queryReferenceView } },
    ],
  }).compileComponents();
  (TestBed.inject(EntityMapperService) as any).findType = findType;

  dataSource = TestBed.runInInjectionContext(() => new AuditDataSource());
  dataSource.loadRecordConfig.set({ entityCtr: AuditRecord });
});

it("should query the audit records directly when no related record is set", async () => {
  await fetchPage();

  expect(findType).toHaveBeenCalled();
  expect(queryReferenceView).not.toHaveBeenCalled();
});

it("should start a related-record page at the range start, not at a position", async () => {
  dataSource.setRelatedRecord({ recordId: "User:1" });

  await fetchPage();

  expect(lastQuery().startkey).toEqual(["User:1", {}]);
  expect(lastQuery().skip).toBeUndefined();
  // the backend only filters and pages a view response when docs are included
  expect(lastQuery().include_docs).toBe(true);
  expect(lastQuery().limit).toBe(2);
});

it("should continue past everything already returned, not past the page size", async () => {
  dataSource.setRelatedRecord({ recordId: "User:1" });
  // three rows were skipped over as denied, so the reported position ran ahead
  queryReferenceView.mockResolvedValue({
    offset: 3,
    rows: [{ doc: rawDoc() }, { doc: rawDoc("Child:2") }],
  });

  const first = await fetchPage();
  await fetchPage(first.bookmark);

  expect(first.bookmark).toBe("5");
  expect(lastQuery().skip).toBe(5);
  // a repeated range start would return the same rows again
  expect(lastQuery().startkey).toBeUndefined();
  expect(lastQuery().endkey).toEqual(["User:1"]);
});

it("should drop rows the backend's permission filter emptied", async () => {
  dataSource.setRelatedRecord({ recordId: "User:1" });
  queryReferenceView.mockResolvedValue({
    offset: 0,
    rows: [{ doc: rawDoc() }, {}],
  });

  const page = await fetchPage();

  expect(page.records.length).toBe(1);
  expect(page.records[0]).toBeInstanceOf(AuditRecord);
  expect(page.records[0].record).toBe("Child:1");
  // the dropped row still counts towards the position of the next one
  expect(page.bookmark).toBe("2");
});

it("should narrow the range by the selected dates", async () => {
  dataSource.setRelatedRecord({
    recordId: "User:1",
    from: new Date("2026-06-01T00:00:00.000Z"),
    to: new Date("2026-06-30T00:00:00.000Z"),
  });

  await fetchPage();

  // descending, so the newer bound opens the range and the older one closes it
  expect(lastQuery().endkey).toEqual(["User:1", "2026-06-01T00:00:00.000Z"]);
  expect(lastQuery().startkey[1]).toMatch(/^2026-06-30T/);
});

it("should go back to the audit records when the related record is cleared", async () => {
  dataSource.setRelatedRecord({ recordId: "User:1" });
  await fetchPage();
  dataSource.setRelatedRecord(undefined);

  await fetchPage();

  expect(findType).toHaveBeenCalled();
});
