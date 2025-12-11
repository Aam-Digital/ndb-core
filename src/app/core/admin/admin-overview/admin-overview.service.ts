import { Injectable } from "@angular/core";
import { MenuItem } from "../../ui/navigation/menu-item";

/**
 * Settings for the Admin Overview page.
 *
 * Use this to dynamically register additional shortcuts for other Feature Modules to be listed in the Admin page.
 */
@Injectable({
  providedIn: "root",
})
export class AdminOverviewService {
  private readonly _templates: MenuItem[] = [];

  get templates(): MenuItem[] {
    return this._templates;
  }

  /**
   * Register a menu entry for the "Templates" section of the Admin Overview.
   * Use this from feature modules to extend the Admin UI.
   */
  addTemplateItems(items: MenuItem | MenuItem[]): void {
    const itemsArray = Array.isArray(items) ? items : [items];
    this._templates.push(...itemsArray);
  }
  /**
   * Configuration section menu items for Admin Overview.
   */
  configurationMenuItems: MenuItem[] = [
    {
      label: $localize`:admin menu item:Record Types & Data Structures`,
      link: "/admin/entity",
    },
    {
      label: $localize`:admin menu item:Site Settings`,
      link: "/admin/site-settings",
    },
    {
      label: $localize`:admin menu item:Setup Wizard`,
      link: "/admin/setup-wizard",
    },
    {
      label: $localize`:admin menu item:Main Menu`,
      link: "/admin/menu",
    },
    {
      label: $localize`:admin menu item:Primary Action`,
      link: "/admin/primary-action",
    },
  ];
}
