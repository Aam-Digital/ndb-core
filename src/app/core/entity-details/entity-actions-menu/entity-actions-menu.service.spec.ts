import { TestBed } from "@angular/core/testing";

import { EntityActionsMenuService } from "./entity-actions-menu.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { Logging } from "../../logging/logging.service";

describe("EntityActionsMenuService", () => {
  let service: EntityActionsMenuService;
  let ability: any;

  beforeEach(() => {
    ability = {
      can: vi.fn().mockName("EntityAbility.can"),
    };
    ability.can.mockReturnValue(true);

    TestBed.configureTestingModule({
      providers: [{ provide: EntityAbility, useValue: ability }],
    });
    service = TestBed.inject(EntityActionsMenuService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should filter out single actions if required permission is missing", async () => {
    const entity = TestEntity.create("Record A");
    ability.can.mockReturnValue(false);

    service.registerActions([
      {
        action: "permission-required",
        label: "Permission Required",
        icon: "lock",
        permission: "update",
        execute: async () => true,
      },
      {
        action: "no-permission-required",
        label: "No Permission Required",
        icon: "check",
        execute: async () => true,
      },
    ]);

    const actions = await service.getActionsForSingle(entity);

    expect(actions.map((action) => action.action)).toEqual([
      "no-permission-required",
    ]);
    expect(ability.can).toHaveBeenCalledWith("update", entity);
  });

  it("should filter out bulk actions if one selected entity is missing permission", async () => {
    const entityA = TestEntity.create("Record A");
    const entityB = TestEntity.create("Record B");
    ability.can.mockImplementation((_action, entity) => entity !== entityB);

    service.registerActions([
      {
        action: "bulk-permission-required",
        label: "Bulk Permission Required",
        icon: "lock",
        permission: "update",
        availableFor: "bulk-only",
        execute: async () => true,
      },
      {
        action: "bulk-no-permission-required",
        label: "Bulk No Permission Required",
        icon: "check",
        availableFor: "bulk-only",
        execute: async () => true,
      },
    ]);

    const actions = await service.getActionsForBulk([entityA, entityB]);

    expect(actions.map((action) => action.action)).toEqual([
      "bulk-no-permission-required",
    ]);
    expect(ability.can).toHaveBeenCalledWith("update", entityA);
    expect(ability.can).toHaveBeenCalledWith("update", entityB);
  });

  it("should not break the whole menu when one action's visible() throws (#4096)", async () => {
    const entity = TestEntity.create("Record A");
    const warnSpy = vi.spyOn(Logging, "warn").mockImplementation(() => {});

    service.registerActions([
      {
        action: "throwing-action",
        label: "Throwing",
        icon: "bug",
        visible: async () => {
          throw new Error("Requested item is not registered ...");
        },
        execute: async () => true,
      },
      {
        action: "healthy-action",
        label: "Healthy",
        icon: "check",
        execute: async () => true,
      },
    ]);

    const actions = await service.getActionsForSingle(entity);

    // the throwing action is hidden, but the menu still resolves with the healthy one
    expect(actions.map((action) => action.action)).toEqual(["healthy-action"]);
    expect(warnSpy).toHaveBeenCalled();
  });
});
