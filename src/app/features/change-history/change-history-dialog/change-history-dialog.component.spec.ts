import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ChangeHistoryDialogComponent } from "./change-history-dialog.component";
import { ChangeHistoryService } from "../change-history.service";
import { Entity } from "../../../core/entity/model/entity";
import { ChangeEvent } from "../change-history.types";

class TestEntity extends Entity {
  static override readonly label = "Test";
  static override readonly icon = "child" as any;
}

let getHistory: ReturnType<typeof vi.fn>;

function evt(id: string, at: string): ChangeEvent {
  return { id, at: new Date(at), by: "User:1", action: "updated", changes: [] };
}

async function render(
  result: ChangeEvent[] | unknown,
): Promise<ComponentFixture<ChangeHistoryDialogComponent>> {
  getHistory = Array.isArray(result)
    ? vi.fn().mockResolvedValue(result)
    : vi.fn().mockRejectedValue(result);

  await TestBed.configureTestingModule({
    imports: [ChangeHistoryDialogComponent],
    providers: [
      { provide: ChangeHistoryService, useValue: { getHistory } },
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

it("loads history into the events signal", async () => {
  const fixture = await render([
    evt("e3", "2026-06-03T10:00:00.000Z"),
    evt("e2", "2026-06-02T10:00:00.000Z"),
    evt("e1", "2026-06-01T10:00:00.000Z"),
  ]);
  const c = fixture.componentInstance;
  expect(c.events()?.map((e) => e.id)).toEqual(["e3", "e2", "e1"]);
  expect(c.status()).toBe("ready");
});

it("shows the empty state (ready) when there is no history", async () => {
  const fixture = await render([]);
  const c = fixture.componentInstance;
  expect(c.events()).toEqual([]);
  expect(c.status()).toBe("ready");
});

it("reports 'disabled' when the audit db does not exist (404 / not_found)", async () => {
  const fixture = await render({ status: 404, name: "not_found" });
  const c = fixture.componentInstance;
  expect(c.status()).toBe("disabled");
  expect(c.events()).toEqual([]);
});

it("reports 'error' for any other read failure", async () => {
  const fixture = await render(new Error("boom"));
  const c = fixture.componentInstance;
  expect(c.status()).toBe("error");
  expect(c.events()).toEqual([]);
});

it("exposes the entity type for the diff view", async () => {
  const fixture = await render([]);
  expect(fixture.componentInstance.entityType).toBe(TestEntity);
});
