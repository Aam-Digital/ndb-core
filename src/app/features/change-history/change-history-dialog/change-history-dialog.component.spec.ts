import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { ChangeHistoryDialogComponent } from "./change-history-dialog.component";
import { ChangeHistoryService } from "../change-history.service";
import { Entity } from "../../../core/entity/model/entity";
import { ChangeEvent } from "../change-history.types";

class TestEntity extends Entity {
  static override readonly label = "Test";
  static override readonly icon: IconName = "child";
}

let getHistory: ReturnType<typeof vi.fn>;

function evt(id: string, at: string): ChangeEvent {
  return { id, at: new Date(at), by: "User:1", action: "updated", changes: [] };
}

async function render(opts?: {
  result?: ChangeEvent[] | Error;
  /** backend feature flag: omitted=true; explicit undefined=still-loading */
  enabled?: boolean;
  hasPermission?: boolean;
}): Promise<ComponentFixture<ChangeHistoryDialogComponent>> {
  const result = opts?.result ?? [];
  // `enabled` omitted -> true; explicitly `undefined` -> still-loading flag
  const enabled = opts && "enabled" in opts ? opts.enabled : true;
  const hasPermission = opts?.hasPermission ?? true;

  getHistory = Array.isArray(result)
    ? vi.fn().mockResolvedValue(result)
    : vi.fn().mockRejectedValue(result);

  await TestBed.configureTestingModule({
    imports: [ChangeHistoryDialogComponent],
    providers: [
      {
        provide: ChangeHistoryService,
        useValue: {
          getHistory,
          isAuditEnabled: signal(enabled),
          hasHistoryPermission: () => hasPermission,
          loadAuditFeatureFlag: () => undefined,
        },
      },
      { provide: MAT_DIALOG_DATA, useValue: { entity: new TestEntity("1") } },
    ],
  })
    .overrideComponent(ChangeHistoryDialogComponent, {
      set: { template: "", imports: [] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(ChangeHistoryDialogComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

it("loads history when the feature is enabled and the user is permitted", async () => {
  const fixture = await render({
    result: [
      evt("e3", "2026-06-03T10:00:00.000Z"),
      evt("e2", "2026-06-02T10:00:00.000Z"),
      evt("e1", "2026-06-01T10:00:00.000Z"),
    ],
  });
  const c = fixture.componentInstance;
  expect(c.events()?.map((e) => e.id)).toEqual(["e3", "e2", "e1"]);
  expect(c.loadError()).toBe(false);
});

it("shows the empty state when enabled, permitted and there is no history", async () => {
  const fixture = await render({ result: [] });
  expect(fixture.componentInstance.events()).toEqual([]);
});

it("flags loadError when the audit-db read fails", async () => {
  const fixture = await render({ result: new Error("boom") });
  expect(fixture.componentInstance.loadError()).toBe(true);
});

it("does not fetch history when the feature is disabled", async () => {
  const fixture = await render({ enabled: false });
  expect(getHistory).not.toHaveBeenCalled();
  expect(fixture.componentInstance.events()).toBeNull();
});

it("does not fetch history while the feature flag is still loading", async () => {
  await render({ enabled: undefined });
  expect(getHistory).not.toHaveBeenCalled();
});

it("does not fetch history when the user lacks permission (but still opens)", async () => {
  const fixture = await render({ hasPermission: false });
  expect(getHistory).not.toHaveBeenCalled();
  expect(fixture.componentInstance.hasPermission).toBe(false);
  expect(fixture.componentInstance.events()).toBeNull();
});

it("exposes the entity type for the diff view", async () => {
  const fixture = await render();
  expect(fixture.componentInstance.entityType).toBe(TestEntity);
});
