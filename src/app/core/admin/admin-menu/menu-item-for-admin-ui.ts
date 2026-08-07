import { FlatTreeAdapter } from "#src/app/utils/flat-tree/flat-tree";
import { EntityMenuItem, MenuItem } from "../../ui/navigation/menu-item";

/**
 * Extension of MenuItem that includes additional properties
 * for the admin drag&drop logic.
 */
export interface MenuItemForAdminUi extends MenuItem {
  uniqueId: string;
  subMenu: MenuItemForAdminUi[];
}

/**
 * Edit the menu as a flat, indented list (see `flat-tree`):
 * every menu item can hold nested sub-items.
 */
export const menuItemTree: FlatTreeAdapter<MenuItemForAdminUi> = {
  id: (item) => item.uniqueId,
  children: (item) => item.subMenu ?? [],
  withChildren: (item, subMenu) => ({ ...item, subMenu }),
};

export class MenuItemForAdminUiNew implements MenuItemForAdminUi {
  constructor(public uniqueId: string) {}

  subMenu = [];
  label: string = "";
  icon?: string;
  link?: string;

  isNew = true;
}

/**
 * True when an item is in manual mode (no entity type) and no link has been set.
 */
export function isManualItemWithoutLink(
  item: MenuItem | EntityMenuItem,
): boolean {
  return !item.link?.trim() && !(item as EntityMenuItem).entityType?.trim();
}
