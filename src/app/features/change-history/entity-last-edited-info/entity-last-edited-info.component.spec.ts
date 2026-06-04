import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { EntityLastEditedInfoComponent } from "./entity-last-edited-info.component";
import { ChangeHistoryDialogComponent } from "../change-history-dialog/change-history-dialog.component";
import { ChangeHistoryService } from "../change-history.service";
import { Entity } from "../../../core/entity/model/entity";
import { UpdateMetadata } from "../../../core/entity/model/update-metadata";

let dialogOpen: ReturnType<typeof vi.fn>;
let canView: ReturnType<typeof vi.fn>;

async function render(
  entity: Entity | undefined,
  canViewHistory = true,
): Promise<ComponentFixture<EntityLastEditedInfoComponent>> {
  dialogOpen = vi.fn();
  canView = vi.fn().mockReturnValue(canViewHistory);
  await TestBed.configureTestingModule({
    imports: [EntityLastEditedInfoComponent],
    providers: [
      { provide: MatDialog, useValue: { open: dialogOpen } },
      { provide: ChangeHistoryService, useValue: { canViewHistory: canView } },
    ],
  })
    .overrideComponent(EntityLastEditedInfoComponent, {
      set: { template: "", imports: [] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(EntityLastEditedInfoComponent);
  fixture.componentRef.setInput("entity", entity);
  fixture.detectChanges();
  return fixture;
}

function entityWithMetadata(): Entity {
  const entity = new Entity("1");
  entity.created = new UpdateMetadata("User:creator", new Date("2025-01-01"));
  entity.updated = new UpdateMetadata("User:editor", new Date("2026-06-01"));
  return entity;
}

it("exposes created and updated metadata of the entity", async () => {
  const fixture = await render(entityWithMetadata());
  const c = fixture.componentInstance;
  expect(c.updated()?.by).toBe("User:editor");
  expect(c.created()?.by).toBe("User:creator");
});

it("has no metadata for a fresh entity without created/updated", async () => {
  const fixture = await render(new Entity("1"));
  const c = fixture.componentInstance;
  expect(c.updated()).toBeUndefined();
  expect(c.created()).toBeUndefined();
});

it("opens the change-history dialog for the entity", async () => {
  const entity = entityWithMetadata();
  const fixture = await render(entity);

  fixture.componentInstance.viewHistory();

  expect(dialogOpen).toHaveBeenCalledTimes(1);
  expect(dialogOpen).toHaveBeenCalledWith(
    ChangeHistoryDialogComponent,
    expect.objectContaining({ data: { entity } }),
  );
});

it("does not open a dialog when no entity is set", async () => {
  const fixture = await render(undefined);
  fixture.componentInstance.viewHistory();
  expect(dialogOpen).not.toHaveBeenCalled();
});

it("does not open the dialog when the user may not view history", async () => {
  const fixture = await render(entityWithMetadata(), false);
  fixture.componentInstance.viewHistory();
  expect(dialogOpen).not.toHaveBeenCalled();
});

it("reflects the service's canViewHistory gate (allowed)", async () => {
  const fixture = await render(entityWithMetadata(), true);
  expect(fixture.componentInstance.canViewHistory()).toBe(true);
});

it("reflects the service's canViewHistory gate (denied)", async () => {
  const fixture = await render(entityWithMetadata(), false);
  expect(fixture.componentInstance.canViewHistory()).toBe(false);
});
