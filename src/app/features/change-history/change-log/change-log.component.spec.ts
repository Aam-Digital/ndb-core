import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ChangeHistoryService } from "../change-history.service";
import { ChangeLogEntry } from "../change-history.types";
import { ChangeLogComponent } from "./change-log.component";

let fixture: ComponentFixture<ChangeLogComponent>;
let component: ChangeLogComponent;
let queryChangeLog: ReturnType<typeof vi.fn>;
let auditEnabled: ReturnType<typeof signal<boolean | undefined>>;
let hasAuditPermission: ReturnType<typeof signal<boolean>>;

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
async function setup(enabled: boolean | "loading" = true, canRead = true) {
  auditEnabled = signal(enabled === "loading" ? undefined : enabled);
  hasAuditPermission = signal(canRead);
  queryChangeLog = vi.fn().mockResolvedValue(page(0));
  await TestBed.configureTestingModule({
    imports: [
      ChangeLogComponent,
      MockedTestingModule.withState(),
      NoopAnimationsModule,
    ],
    providers: [
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
    from: undefined,
    to: undefined,
  });
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

it("surfaces a load failure instead of an empty list", async () => {
  await setup();
  queryChangeLog.mockRejectedValue(new Error("service unavailable"));

  component.setEntityTypeFilter("Child");
  await settle();

  expect(component.loadError()).toBe(true);
});
