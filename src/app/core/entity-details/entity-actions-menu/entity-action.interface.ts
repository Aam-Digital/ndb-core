import { Entity } from "../../entity/model/entity";
import { EntityActionPermission } from "../../permissions/permission-types";

/** Collapses its actions into one parent item opening a submenu.
 *  For actions registered in variable numbers, e.g. one per entity reference field. */
export interface EntityActionGroup {
  /** actions sharing this id are displayed together */
  id: string;
  label: string;
  icon: string;
}

/**
 * Details of an action that users can trigger for a specific entity, displayed in the context menu.
 */
export interface EntityAction {
  /**
   * Determines where this action is available:
   * - 'all': available for both individual and bulk actions (default)
   * - 'bulk-only': only available as a bulk action
   * - 'individual-only': only available for single entity actions
   */
  availableFor?: "all" | "bulk-only" | "individual-only";

  /**
   * ID for identifying this action in analytics, etc.
   */
  action: string;

  /**
   * human-readable label displayed in menu
   */
  label: string;
  icon: string;
  tooltip?: string;

  /** flat-list contexts (e.g. the bulk action select) ignore this and use `label` */
  group?: EntityActionGroup;

  /** displayed instead of `label` inside the group's submenu, if not empty */
  shortLabel?: string;

  /**
   * If marked as primary action, it will be displayed directly rather than hidden in the three-dot menu in some contexts.
   */
  primaryAction?: boolean;

  /**
   * The "operation" for Entity Permissions checks that the user needs permission for executing this action.
   */
  permission?: EntityActionPermission;

  /**
   * The method being executed when the action is triggered.
   * @param e The entity on which the action is executed
   */
  execute: (
    entity: Entity | Entity[],
    navigateOnDelete?: boolean,
  ) => Promise<boolean>;

  /**
   * Controls visibility of the action based on the given entity.
   * Should return a Promise resolving to true if visible.
   */
  visible?: (entity: Entity | Entity[]) => Promise<boolean>;
}
