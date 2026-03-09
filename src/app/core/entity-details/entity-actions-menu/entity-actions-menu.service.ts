import { Injectable, inject } from "@angular/core";
import { EntityAction } from "./entity-action.interface";
import { Entity } from "../../entity/model/entity";
import { EntityAbility } from "../../permissions/ability/entity-ability";

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
  private readonly ability = inject(EntityAbility, { optional: true });

  getActions(entity?: Entity): EntityAction[] {
    return [
      ...this.actions,
      ...this.actionsFactories.flatMap((factory) => factory(entity)),
    ];
  }

  /**
   * Get only actions available for bulk operations.
   */
  async getVisibleActions(
    entities: Entity | Entity[] | undefined,
    availableFor: "bulk-only" | "individual-only" | "all",
  ): Promise<EntityAction[]> {
    const entity = Array.isArray(entities) ? entities[0] : entities;
    const actions = this.getActions(entity).filter((action) => {
      const avail = action.availableFor ?? "all";
      return avail === availableFor || avail === "all";
    });
    const visibleActions: EntityAction[] = [];
    for (const action of actions) {
      let isVisible: boolean;
      if (action.visible) {
        isVisible = await action.visible(entities);
      } else {
        isVisible = true;
      }
      if (isVisible && this.hasRequiredPermission(action, entities)) {
        visibleActions.push(action);
      }
    }
    return visibleActions;
  }

  async getActionsForBulk(entities?: Entity[]): Promise<EntityAction[]> {
    return this.getVisibleActions(entities ?? [], "bulk-only");
  }

  /**
   * Get only actions available for single entity operations.
   * @param entity
   */
  async getActionsForSingle(entity?: Entity): Promise<EntityAction[]> {
    return this.getVisibleActions(entity, "individual-only");
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

  private hasRequiredPermission(
    action: EntityAction,
    entities: Entity | Entity[] | undefined,
  ): boolean {
    if (!action.permission || !this.ability) {
      return true;
    }

    const entitiesToCheck = Array.isArray(entities) ? entities : [entities];
    const validEntities = entitiesToCheck.filter(
      (entity): entity is Entity => !!entity,
    );

    // Keep action visibility stable when there is no selected entity yet.
    if (validEntities.length === 0) {
      return true;
    }

    return validEntities.every((entity) =>
      this.ability.can(action.permission, entity),
    );
  }

  /**
   * Remove multiple registered static actions by their action keys.
   * @param actionKeys Array of action keys to unregister.
   */
  unregisterActions(actionKeys: string[]): void {
    this.actions = this.actions.filter(
      (action) => !actionKeys.includes(action.action),
    );
  }
}

export type EntityActionsFactory = (entity: Entity) => EntityAction[];
