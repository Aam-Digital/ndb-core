import { EntityMenuItem, MenuItem } from "../../ui/navigation/menu-item";

/**
 * Extension of MenuItem that includes additional properties
 * for the admin drag&drop logic.
 */
export interface MenuItemForAdminUi extends MenuItem {
  uniqueId: string;
  subMenu: MenuItemForAdminUi[];
}

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

/**
 * True when an item has no destination link and also no nested sub-items.
 */
export function hasNoLinkAndNoSubItems(item: MenuItemForAdminUi): boolean {
  return (
    isManualItemWithoutLink(item) &&
    (!item.subMenu || item.subMenu.length === 0)
  );
}
