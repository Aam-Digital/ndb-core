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

  /**
   * Add (static) actions to be shown for all entity actions context menus.
   */
  registerActions(newActions: EntityAction[]) {
    this.actions.push(...newActions);
  }

  /**
   * Add factory functions to generate additional actions for the entity context menu
   * depending on the specific entity for which the menu is displayed (e.g. only for entities of specific states).
   */
  registerActionsFactories(newActions: EntityActionsFactory[]) {
    this.actionsFactories.push(...newActions);
  }
}

export type EntityActionsFactory = (entity: Entity) => EntityAction[];
