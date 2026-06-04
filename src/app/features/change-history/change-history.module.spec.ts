import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import {
  CHANGE_AUDIT_SUBJECT,
  ChangeHistoryModule,
} from "./change-history.module";
import { ChangeHistoryDialogComponent } from "./change-history-dialog/change-history-dialog.component";
import { EntityActionsMenuService } from "../../core/entity-details/entity-actions-menu/entity-actions-menu.service";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { EntityAction } from "../../core/entity-details/entity-actions-menu/entity-action.interface";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseFactoryService } from "../../core/database/database-factory.service";

class InternalEntity extends Entity {
  static override isInternalEntity = true;
}

let registered: EntityAction[];
let dialogOpen: ReturnType<typeof vi.fn>;
let abilityCan: ReturnType<typeof vi.fn>;

function setup() {
  registered = [];
  dialogOpen = vi.fn();
  abilityCan = vi.fn().mockReturnValue(true);
  TestBed.configureTestingModule({
    providers: [
      ChangeHistoryModule,
      {
        provide: EntityActionsMenuService,
        useValue: {
          registerActions: (actions: EntityAction[]) =>
            registered.push(...actions),
        },
      },
      { provide: MatDialog, useValue: { open: dialogOpen } },
      { provide: EntityAbility, useValue: { can: abilityCan } },
      {
        provide: DatabaseFactoryService,
        useValue: { createRemoteDatabase: vi.fn() },
      },
    ],
  });
  TestBed.inject(ChangeHistoryModule);
  return registered.find((a) => a.action === "view-change-history")!;
}

function savedEntity(): Entity {
  const e = new Entity("1");
  e._rev = "1-abc";
  return e;
}

it("registers the view-change-history action with the clock icon", () => {
  const action = setup();
  expect(action).toBeDefined();
  expect(action.icon).toBe("clock-rotate-left");
  expect(action.availableFor).toBe("individual-only");
});

it("opens the change-history dialog on execute", async () => {
  const action = setup();
  const entity = savedEntity();

  await action.execute(entity);

  expect(dialogOpen).toHaveBeenCalledWith(
    ChangeHistoryDialogComponent,
    expect.objectContaining({ data: { entity } }),
  );
});

it("is visible for a saved entity when ChangeAudit read is granted", async () => {
  const action = setup();
  expect(await action.visible(savedEntity())).toBe(true);
  expect(abilityCan).toHaveBeenCalledWith("read", CHANGE_AUDIT_SUBJECT);
});

it("is hidden when ChangeAudit read is denied", async () => {
  const action = setup();
  abilityCan.mockReturnValue(false);
  expect(await action.visible(savedEntity())).toBe(false);
});

it("is hidden for a new (unsaved) entity", async () => {
  const action = setup();
  expect(await action.visible(new Entity("1"))).toBe(false);
});

it("is hidden for an internal entity", async () => {
  const action = setup();
  const internal = new InternalEntity("1");
  internal._rev = "1-abc";
  expect(await action.visible(internal)).toBe(false);
});
