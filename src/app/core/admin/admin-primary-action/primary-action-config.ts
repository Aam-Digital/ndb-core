/**
 * Configuration for the floating primary action button.
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
