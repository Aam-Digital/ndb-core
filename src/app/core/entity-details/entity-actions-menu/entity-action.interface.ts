import { Entity } from "../../entity/model/entity";
import { EntityActionPermission } from "../../permissions/permission-types";

/**
 * Details of an action that users can trigger for a specific entity, displayed in the context menu.
 */
export interface EntityAction {
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
  execute: (entity: Entity, navigateOnDelete?: boolean) => Promise<boolean>;
}
