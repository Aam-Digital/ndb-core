import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Router } from "@angular/router";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { MockEntityMapperService } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ChangeHistoryService } from "../change-history.service";
import { ChangeLogEntry } from "../change-history.types";
import { ChangeHistoryDialogComponent } from "../change-history-dialog/change-history-dialog.component";
import { ChangeLogComponent } from "./change-log.component";

let fixture: ComponentFixture<ChangeLogComponent>;
let component: ChangeLogComponent;
let queryChangeLog: ReturnType<typeof vi.fn>;
let auditEnabled: ReturnType<typeof signal<boolean | undefined>>;
let hasAuditPermission: ReturnType<typeof signal<boolean>>;
let dialogOpen: ReturnType<typeof vi.fn>;

function entry(id: string): ChangeLogEntry {
  return {
    id,
    at: new Date("2026-06-03T10:00:00.000Z"),
    by: "demo-admin",
    action: "updated",
    entityId: "Child:1",
    entityType: "Child",
    changedFields: ["name"],
  };
}

/** one page of `count` entries, reporting whether a further page exists */
function page(count: number, hasMore = false) {
  return {
    entries: Array.from({ length: count }, (_, i) => entry(`audit-${i}`)),
    hasMore,
  };
}

// "loading" rather than undefined: a default parameter would swallow undefined
async function setup(
  enabled: boolean | "loading" = true,
  canRead = true,
  queryParams: Record<string, string> = {},
) {
  auditEnabled = signal(enabled === "loading" ? undefined : enabled);
  hasAuditPermission = signal(canRead);
  queryChangeLog = vi.fn().mockResolvedValue(page(0));
  dialogOpen = vi.fn();
  await TestBed.configureTestingModule({
    imports: [
      ChangeLogComponent,
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
          hasAuditPermission,
          loadAuditFeatureFlag: vi.fn(),
          queryChangeLog,
          getChangeAuthors: vi.fn().mockResolvedValue(["demo-admin", "priya"]),
        },
      },
      { provide: MatDialog, useValue: { open: dialogOpen } },
    ],
  }).compileComponents();

  fixture = TestBed.createComponent(ChangeLogComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
  await settle();
}

/**
 * Flush the resource loads triggered by the last change.
 *
 * `whenStable()` is unusable here: the rendered rows' `notificationTime` pipe
 * holds a recurring timer, so the zone never becomes stable once a page has
 * loaded. The mocked loaders resolve on the microtask queue instead.
 */
async function settle() {
  for (let i = 0; i < 3; i++) {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
  }
  fixture.detectChanges();
}

/** the filters the given `queryChangeLog` call was made with */
function callArgs(index = -1) {
  return queryChangeLog.mock.calls.at(index);
}

it("loads the first page and the author options when enabled and permitted", async () => {
  await setup();

  expect(callArgs()).toEqual([
    {
      entityType: undefined,
      changedBy: undefined,
      relatedEntityId: undefined,
      from: undefined,
      to: undefined,
    },
    10,
    0,
  ]);
  // each option keeps the raw value to filter on, plus the id to resolve a name
  expect(component.authors()).toEqual([
    { value: "demo-admin", entityId: undefined },
    { value: "priya", entityId: undefined },
  ]);
});

it("starts pre-filtered by the record type the caller navigated from", async () => {
  // an entity list links here with its own type, so the log opens showing that
  // type's changes rather than the whole system's
  await setup(true, true, { entityType: "School" });

  expect(component.entityTypeFilter()).toBe("School");
  expect(callArgs()[0].entityType).toBe("School");
});

it("does not query while the feature flag is still loading, then queries once it is on", async () => {
  await setup("loading");
  expect(queryChangeLog).not.toHaveBeenCalled();

  auditEnabled.set(true);
  await settle();

  expect(queryChangeLog).toHaveBeenCalledTimes(1);
});

it("does not query when the feature is switched off", async () => {
  await setup(false);
  expect(queryChangeLog).not.toHaveBeenCalled();
});

it("does not query when the user may not read audit data", async () => {
  await setup(true, false);
  expect(queryChangeLog).not.toHaveBeenCalled();
});

it("starts querying once the user's rules grant audit access", async () => {
  await setup(true, false);

  hasAuditPermission.set(true);
  await settle();

  expect(queryChangeLog).toHaveBeenCalledTimes(1);
});

it("re-queries with the selected record type and author", async () => {
  await setup();

  component.setEntityTypeFilter("School");
  component.setChangedByFilter("priya");
  await settle();

  expect(callArgs()[0]).toEqual({
    entityType: "School",
    changedBy: "priya",
    relatedEntityId: undefined,
    from: undefined,
    to: undefined,
  });
});

it("re-queries for the changes related to a pasted record id", async () => {
  await setup();

  component.setRelatedEntityFilter("User:1");
  await settle();

  expect(callArgs()[0].relatedEntityId).toBe("User:1");
});

it("trims a pasted record id, and treats a blank one as no restriction", async () => {
  await setup();

  component.setRelatedEntityFilter("  User:1 ");
  await settle();
  expect(callArgs()[0].relatedEntityId).toBe("User:1");

  component.setRelatedEntityFilter("   ");
  await settle();
  expect(callArgs()[0].relatedEntityId).toBeUndefined();
});

it("stops applying the record type and author filters while a related record is set", async () => {
  await setup();
  component.setEntityTypeFilter("School");
  component.setChangedByFilter("priya");
  await settle();

  component.setRelatedEntityFilter("User:1");
  await settle();

  // the reference view is keyed on the referenced id, so it cannot serve these
  expect(component.otherFiltersDisabled()).toBe(true);
  expect(callArgs()[0].entityType).toBeUndefined();
  expect(callArgs()[0].changedBy).toBeUndefined();
});

it("applies the kept record type and author selection again once the id is cleared", async () => {
  await setup();
  component.setEntityTypeFilter("School");
  component.setRelatedEntityFilter("User:1");
  await settle();

  component.setRelatedEntityFilter(undefined);
  await settle();

  expect(component.otherFiltersDisabled()).toBe(false);
  expect(callArgs()[0].entityType).toBe("School");
});

it("returns to the first page when the related record filter changes", async () => {
  await setup();
  queryChangeLog.mockResolvedValue(page(10, true));
  component.onPageChange({ pageIndex: 1, pageSize: 10, length: 11 });
  await settle();

  component.setRelatedEntityFilter("User:1");
  await settle();

  expect(component.pageIndex()).toBe(0);
});

it("re-queries with the selected action and returns to the first page", async () => {
  await setup();
  component.onPageChange({ pageIndex: 1, pageSize: 10, length: 11 });
  await settle();

  component.setActionFilter("deleted");
  await settle();

  expect(callArgs()[0].action).toBe("deleted");
  expect(component.pageIndex()).toBe(0);
});

it("does not apply the action filter while filtering by a related record", async () => {
  await setup();
  component.setActionFilter("deleted");
  await settle();

  component.setRelatedEntityFilter("Child:1");
  await settle();

  // the view behind the related-record filter cannot narrow by operation
  expect(callArgs()[0].action).toBeUndefined();
  expect(component.otherFiltersDisabled()).toBe(true);
});

it("passes the picked date range through as the time bounds", async () => {
  await setup();
  const from = new Date("2026-06-01T00:00:00.000Z");
  const to = new Date("2026-06-30T23:59:59.999Z");

  component.onDateRangeChange({ from, to });
  await settle();

  expect(callArgs()[0].from).toEqual(from);
  expect(callArgs()[0].to).toEqual(to);
});

it("treats a cleared date range as no restriction", async () => {
  await setup();
  component.onDateRangeChange({ from: new Date(), to: new Date() });
  await settle();

  component.onDateRangeChange({ from: null, to: null });
  await settle();

  expect(callArgs()[0].from).toBeUndefined();
  expect(callArgs()[0].to).toBeUndefined();
});

it("requests the next page by index", async () => {
  await setup();
  queryChangeLog.mockResolvedValue(page(10, true));
  component.setEntityTypeFilter("Child");
  await settle();

  component.onPageChange({ pageIndex: 1, pageSize: 10, length: 11 });
  await settle();

  expect(callArgs()[2]).toBe(1);
});

it("returns to the first page when a filter or the page size changes", async () => {
  await setup();
  queryChangeLog.mockResolvedValue(page(10, true));
  component.onPageChange({ pageIndex: 1, pageSize: 10, length: 11 });
  await settle();

  component.onPageChange({ pageIndex: 1, pageSize: 25, length: 11 });
  await settle();

  expect(component.pageIndex()).toBe(0);
  expect(callArgs()[1]).toBe(25);
  expect(callArgs()[2]).toBe(0);
});

it("offers a further page only when the backend reported one", async () => {
  await setup();
  queryChangeLog.mockResolvedValue(page(10, true));
  component.setEntityTypeFilter("Child");
  await settle();
  // 10 loaded + 1 to keep "next" reachable
  expect(component.pageLengthHint()).toBe(11);

  // a page that exactly fills but has nothing after it must not offer a next
  queryChangeLog.mockResolvedValue(page(10, false));
  component.setEntityTypeFilter("School");
  await settle();
  expect(component.pageLengthHint()).toBe(10);
});

it("shows the record type as its label, and each row's own record id", async () => {
  await setup();
  // records generated from one template share a title (every event of a
  // recurring activity), so without the id the rows read as repeats of one
  // record — which is the whole reason both are displayed
  queryChangeLog.mockResolvedValue({
    entries: [
      {
        ...entry("audit-1"),
        entityId: "TestEntity:1",
        entityType: "TestEntity",
      },
      {
        ...entry("audit-2"),
        entityId: "TestEntity:2",
        entityType: "TestEntity",
      },
    ],
    hasMore: false,
  });
  component.setEntityTypeFilter("TestEntity");
  await settle();

  const rows = [...fixture.nativeElement.querySelectorAll("tbody tr")].map(
    (row: HTMLElement) => row.textContent,
  );
  expect(rows).toHaveLength(2);
  // the registered label, not the raw type key
  expect(rows[0]).toContain(TestEntity.label);
  expect(rows[0]).toContain("TestEntity:1");
  expect(rows[1]).toContain("TestEntity:2");
});

/** the entity the change-history dialog was opened for */
function dialogEntity() {
  return dialogOpen.mock.calls.at(-1)[1].data.entity;
}

it("opens the record's full change history when a row is clicked", async () => {
  await setup();
  const record = new TestEntity("1");
  (TestBed.inject(EntityMapperService) as MockEntityMapperService).add(record);
  queryChangeLog.mockResolvedValue({
    entries: [
      {
        ...entry("audit-1"),
        entityId: "TestEntity:1",
        entityType: "TestEntity",
      },
    ],
    hasMore: false,
  });
  component.setEntityTypeFilter("TestEntity");
  await settle();

  fixture.nativeElement.querySelector("tbody tr").click();
  await settle();

  // the same dialog the record's details view offers, so the row's single
  // change is shown in the context of the record's whole history
  expect(dialogOpen).toHaveBeenCalledWith(
    ChangeHistoryDialogComponent,
    expect.anything(),
  );
  expect(dialogEntity()).toBe(record);
});

it("keeps the record link opening the record itself, not its history", async () => {
  await setup();
  const record = new TestEntity("1");
  (TestBed.inject(EntityMapperService) as MockEntityMapperService).add(record);
  const navigate = vi.spyOn(TestBed.inject(Router), "navigate");
  queryChangeLog.mockResolvedValue({
    entries: [
      {
        ...entry("audit-1"),
        entityId: "TestEntity:1",
        entityType: "TestEntity",
      },
    ],
    hasMore: false,
  });
  component.setEntityTypeFilter("TestEntity");
  await settle();

  // the "Record" column links to the details view - a different destination
  // than the row's history dialog, so the click must not reach the row
  fixture.nativeElement
    .querySelector("tbody tr app-entity-block .clickable")
    .click();
  await settle();

  expect(navigate).toHaveBeenCalled();
  expect(dialogOpen).not.toHaveBeenCalled();
});

it("opens the history from a deleted record's own block, which links nowhere", async () => {
  await setup();
  // nothing added to the entity mapper: the record is gone, so its block shows
  // the id without a link - the row is what the click belongs to
  queryChangeLog.mockResolvedValue({
    entries: [
      {
        ...entry("audit-1"),
        entityId: "TestEntity:deleted",
        entityType: "TestEntity",
      },
    ],
    hasMore: false,
  });
  component.setEntityTypeFilter("TestEntity");
  await settle();

  fixture.nativeElement.querySelector("tbody tr app-entity-block span").click();
  await settle();

  expect(dialogOpen).toHaveBeenCalled();
});

it("opens the history of a deleted record with a stand-in for the record", async () => {
  await setup();

  // nothing added to the entity mapper: the record is gone, which is exactly
  // the case the change log is there for
  await component.openHistory({
    ...entry("audit-1"),
    entityId: "TestEntity:deleted",
    entityType: "TestEntity",
  });

  const standIn = dialogEntity();
  expect(standIn).toBeInstanceOf(TestEntity);
  // the id is all the dialog needs to load the history of the deleted record
  expect(standIn.getId()).toBe("TestEntity:deleted");
});

it("does not open a history for a record type that is no longer registered", async () => {
  await setup();
  const removedType = {
    ...entry("audit-1"),
    entityId: "LegacyType:1",
    entityType: "LegacyType",
  };

  expect(component.canOpenHistory(removedType)).toBe(false);
  await component.openHistory(removedType);
  expect(dialogOpen).not.toHaveBeenCalled();
});

it("does not open a dialog when the click only ended a text selection", async () => {
  await setup();
  // the record id is displayed to be copied into the related-record filter,
  // and selecting it ends in a click on the row
  vi.spyOn(window, "getSelection").mockReturnValue({
    toString: () => "TestEntity:1",
  } as Selection);

  await component.openHistory({
    ...entry("audit-1"),
    entityId: "TestEntity:1",
    entityType: "TestEntity",
  });

  expect(dialogOpen).not.toHaveBeenCalled();
});

it("surfaces a load failure instead of an empty list", async () => {
  await setup();
  queryChangeLog.mockRejectedValue(new Error("service unavailable"));

  component.setEntityTypeFilter("Child");
  await settle();

  expect(component.loadError()).toBe(true);
});
