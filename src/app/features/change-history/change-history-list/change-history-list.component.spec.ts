import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { MockEntityMapperService } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ChangeHistoryService } from "../change-history.service";
import { ChangeHistoryDialogComponent } from "../change-history-dialog/change-history-dialog.component";
import { ChangeHistoryListComponent } from "./change-history-list.component";
import { AuditRecord } from "../model/audit-record";
import { TableStateUrlService } from "../../../core/common-components/entities-table/table-state-url.service";

/** the built selector, which is an untyped Mango object at the database edge */
function selector(): Record<string, any> {
  return component.filter() as Record<string, any>;
}

let fixture: ComponentFixture<ChangeHistoryListComponent>;
let component: ChangeHistoryListComponent;
let auditEnabled: ReturnType<typeof signal<boolean | undefined>>;
let dialogOpen: ReturnType<typeof vi.fn>;

/** an audit record of `type:id`, as loaded from the audit database */
function auditRecord(recordId = "Child:1"): AuditRecord {
  const record = new AuditRecord(`${recordId}:2026-06-03T10:00:00.000Z:2-abc`);
  record.operation = "update";
  record.timestamp = new Date("2026-06-03T10:00:00.000Z");
  return record;
}

// "loading" rather than undefined: a default parameter would swallow undefined
async function setup(
  enabled: boolean | "loading" = true,
  canRead = true,
  queryParams: Record<string, string> = {},
) {
  auditEnabled = signal(enabled === "loading" ? undefined : enabled);
  dialogOpen = vi.fn();
  await TestBed.configureTestingModule({
    imports: [
      ChangeHistoryListComponent,
      MockedTestingModule.withState(),
      NoopAnimationsModule,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { queryParamMap: convertToParamMap(queryParams) },
        },
      },
      {
        provide: ChangeHistoryService,
        useValue: {
          isAuditEnabled: auditEnabled,
          hasHistoryPermission: () => canRead,
          loadAuditFeatureFlag: vi.fn(),
          getChangeAuthors: vi.fn().mockResolvedValue(["demo-admin", "priya"]),
        },
      },
      { provide: MatDialog, useValue: { open: dialogOpen } },
    ],
  }).compileComponents();

  fixture = TestBed.createComponent(ChangeHistoryListComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
}

// the dialog spy is installed on a static, so it outlives the fixture
afterEach(() => vi.restoreAllMocks());

it("should page through the audit records with the generic data source", async () => {
  await setup();

  expect(component.dataSource.loadRecordConfig().entityCtr).toBe(AuditRecord);
  // ordering by the default `_id` would group the log by record, not by time
  expect(component.sortBy).toEqual({ active: "timestamp", direction: "desc" });
});

it("should query only what the log always excludes while nothing is selected", async () => {
  await setup();

  expect(selector()).toEqual({
    timestamp: { $gt: null },
    operation: { $ne: "baseline" },
  });
});

it("should apply the user's selection under what the log always excludes", async () => {
  await setup();

  component.onFilterChange({ operation: "delete" } as any);

  // a baseline stays excluded whatever the user selects, so the restriction
  // cannot be widened by clearing the filters
  expect(selector().$and).toEqual([
    { timestamp: { $gt: null }, operation: { $ne: "baseline" } },
    { operation: "delete" },
  ]);
});

it("should offer a filter per dimension the ordinary query can narrow", async () => {
  await setup();

  expect(component.filterConfig().map((config) => config.id)).toEqual([
    "entityType",
    "operation",
    "changedBy",
    "timestamp",
  ]);
});

it("should stop querying a selection the filter bar no longer holds", async () => {
  // the bar compares each new selection against what it was given before
  // emitting. Left unbound, that comparison would see no change and suppress
  // the emission that clears the last filter - the list would go on querying a
  // selection that is no longer shown anywhere, and silently return nothing
  await setup();

  component.selectedFilter.set({ operation: "delete" } as any);
  fixture.detectChanges();

  expect(component.selectedFilter()).toEqual({});
  expect(selector()).toEqual({
    timestamp: { $gt: null },
    operation: { $ne: "baseline" },
  });
});

it("should drop the filters it stops offering from the URL too", async () => {
  // the shared filter bar restores any URL parameter naming a field of the
  // entity, so a left-over one would come back as an unconfigured filter -
  // narrowing a query the related-record view does not apply it to
  await setup();
  const tableStateUrl = TestBed.inject(TableStateUrlService);
  const clearFilterParams = vi.spyOn(tableStateUrl, "clearFilterParams");

  component.setRelatedEntityFilter("User:1");

  const cleared = clearFilterParams.mock.calls.at(-1)[0];
  expect(cleared).toEqual(
    expect.arrayContaining(["entityType", "operation", "changedBy"]),
  );
  // the one it still offers has to keep its selection
  expect(cleared).not.toContain("timestamp");
});

it("should offer only the date range once a related record is named", async () => {
  // the view answering it is keyed on the referenced id, so the others would
  // need a different key order - they are not offered rather than ignored
  await setup();

  component.setRelatedEntityFilter("User:1");

  expect(component.filterConfig().map((config) => config.id)).toEqual([
    "timestamp",
  ]);
});

it("should not offer the table when the feature is switched off", async () => {
  await setup(false);

  expect(fixture.nativeElement.querySelector("app-entities-table")).toBeNull();
});

it("should not offer the table when the user may not read audit data", async () => {
  await setup(true, false);

  expect(fixture.nativeElement.querySelector("app-entities-table")).toBeNull();
  expect(fixture.nativeElement.textContent).toContain(
    "don't have permission to view the change log",
  );
});

it("should open the record's full change history from a row", async () => {
  await setup();
  const record = new TestEntity("1");
  (
    TestBed.inject(EntityMapperService) as unknown as MockEntityMapperService
  ).addAll([record]);
  const dialogSpy = vi
    .spyOn(ChangeHistoryDialogComponent, "open")
    .mockReturnValue(undefined);

  const row = auditRecord(record.getId());
  await component.openHistory(row);

  // opened on the clicked change, rather than a collapsed list to search again
  expect(dialogSpy).toHaveBeenCalledWith(
    expect.anything(),
    record,
    row.getId(),
  );
});

it("should open the history of a deleted record with a stand-in for the record", async () => {
  await setup();
  const dialogSpy = vi
    .spyOn(ChangeHistoryDialogComponent, "open")
    .mockReturnValue(undefined);

  await component.openHistory(auditRecord("TestEntity:gone"));

  // the record itself cannot be loaded any more, but its history still exists
  const [, standIn] = dialogSpy.mock.calls.at(-1);
  expect(standIn.getId()).toBe("TestEntity:gone");
  expect(standIn).toBeInstanceOf(TestEntity);
});

it("should still open a history for a record type that is no longer registered", async () => {
  await setup();
  const dialogSpy = vi
    .spyOn(ChangeHistoryDialogComponent, "open")
    .mockReturnValue(undefined);

  await component.openHistory(auditRecord("RetiredType:1"));

  // only the id is needed to query the history, and it must not be prefixed a
  // second time or it would address a record that never existed
  const [, standIn] = dialogSpy.mock.calls.at(-1);
  expect(standIn.getId()).toBe("RetiredType:1");
});
