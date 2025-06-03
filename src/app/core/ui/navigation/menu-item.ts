/**
 * Structure for menu items to be displayed.
 */
export interface MenuItem {
  /**
   * The text to be displayed in the menu.
   */
  label: string;
  /**
   * The icon to be displayed left of the label.
   */
  icon?: string;
  /**
   * The url fragment to which the item will route to (e.g. '/dashboard')
   */
  link?: string;

  subMenu?: MenuItem[];

  /**
   * Unique identifier for the menu item, used for drag-and-drop operations.
   */
  uniqueId?: string;
}

/**
 * An alternative MenuItem details of an entry in the main navigation.
 */
export interface EntityMenuItem extends MenuItem {
  /**
   * The entity type to whose list this item should link.
   */
  entityType: string;
}

/**
 * Object specifying overall navigation menu
 * as stored in the config database
 */
export interface NavigationMenuConfig {
  items: MenuItem[];
}
