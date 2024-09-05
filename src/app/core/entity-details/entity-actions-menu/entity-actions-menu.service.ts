import { Injectable } from "@angular/core";
import { EntityAction } from "./entity-action.interface";

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

  getActions() {
    return this.actions;
  }

  registerActions(newActions: EntityAction[]) {
    this.actions.push(...newActions);
  }
}
