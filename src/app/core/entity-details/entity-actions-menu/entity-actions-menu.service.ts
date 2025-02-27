import { Injectable } from "@angular/core";
import { EntityAction } from "./entity-action.interface";
import { Entity } from "../../entity/model/entity";

/**
 * Register and access actions that can be performed on an entity
 * and displayed to users in the entity details context menu.
 *
 * Feature Modules can register additional actions here.
 *
 * TODO: rename existing EntityActionsService to avoid confusions? (I would prefer this one here to be called EntityActionsService)
 */
@Injectable({
  providedIn: "root",
})
export class EntityActionsMenuService {
  private actions: EntityAction[] = [];
  private actionsFactories: EntityActionsFactory[] = [];

  getActions(entity?: Entity): EntityAction[] {
    return [
      ...this.actions,
      ...this.actionsFactories.flatMap((factory) => factory(entity)),
    ];
  }

  registerActions(newActions: EntityAction[]) {
    this.actions.push(...newActions);
  }

  registerActionsFactories(newActions: EntityActionsFactory[]) {
    this.actionsFactories.push(...newActions);
  }
}

export type EntityActionsFactory = (entity: Entity) => EntityAction[];
