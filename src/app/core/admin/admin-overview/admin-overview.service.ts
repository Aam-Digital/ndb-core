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
      link: "/admin/site-settings",
    },
    {
      label: $localize`:admin menu item:Database Conflicts`,
      link: "/admin/conflicts",
    },
    {
      label: $localize`:admin menu item:Administer Entity Types`,
      link: "/admin/entity",
    },
    {
      label: $localize`:admin menu item:Setup Wizard`,
      link: "/admin/setup-wizard",
    },
    {
      label: $localize`:admin menu item:Manage Public Forms`,
      link: "/admin/publicform",
    },
  ];
}
