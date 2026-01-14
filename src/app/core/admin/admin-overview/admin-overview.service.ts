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
      subtitle: $localize`:admin menu item subtitle:Define what data you can manage by configuring the fields of lists and profiles.`,
    },
    {
      label: $localize`:admin menu item:Site Settings`,
      link: "/admin/site-settings",
      subtitle: $localize`:admin menu item subtitle:Manage the overall site configuration, including language, colors and fonts.`,
    },
    {
      label: $localize`:admin menu item:Setup Wizard`,
      link: "/admin/setup-wizard",
      subtitle: $localize`:admin menu item subtitle:A quick guide to help with essential setup steps and configuration.`,
    },
    {
      label: $localize`:admin menu item:Main Menu`,
      link: "/admin/menu",
      subtitle: $localize`:admin menu item subtitle:Organize the menu items listed on the left.`,
    },
    {
      label: $localize`:admin menu item:Primary Action`,
      link: "/admin/primary-action",
      subtitle: $localize`:admin menu item subtitle:Set the main action or workflow users should focus on in the system.`,
    },
  ];
}
