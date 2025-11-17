/**
 * Configuration for the floating primary action button.
 *
 * icon: FontAwesome icon name (e.g. "plus", "file-alt")
 * actionType: "createEntity" or "navigate"
 * entityType: Name of the entity to create (if actionType is "createEntity")
 * route: Route to navigate to (if actionType is "navigate")
 */
export interface PrimaryActionConfig {
  /** FontAwesome icon name (e.g. "plus", "file-alt") */
  icon: string;
  /** "createEntity" or "navigate" */
  actionType: "createEntity" | "navigate";
  /** Name of the entity to create (if actionType is "createEntity") */
  entityType?: string;
  /** Route to navigate to (if actionType is "navigate") */
  route?: string;
}
