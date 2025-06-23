import { MenuItem } from "../../ui/navigation/menu-item";

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
