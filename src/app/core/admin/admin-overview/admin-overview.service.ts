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
  menuItems: MenuItem[] = [
    {
      label: $localize`:admin menu item:Site Settings`,
      target: "/admin/site-settings",
    },
    {
      label: $localize`:admin menu item:Database Conflicts`,
      target: "/admin/conflicts",
    },
    {
      label: $localize`:admin menu item:Administer Entity Types`,
      target: "/admin/entity",
    },
    {
      label: $localize`:admin menu item:Setup Wizard`,
      target: "/admin/setup-wizard",
    },
  ];
}
