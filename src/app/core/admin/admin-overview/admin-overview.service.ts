import { Injectable } from "@angular/core";
import { MenuItem } from "../../ui/navigation/menu-item";
import { AdminSection } from "./admin-section.interface";
import { DEFAULT_ADMIN_SECTIONS } from "./admin-overview-sections";

/**
 * Settings for the Admin Overview page.
 *
 * Use this to dynamically register additional shortcuts for other Feature Modules to be listed in the Admin page.
 */
@Injectable({
  providedIn: "root",
})
export class AdminOverviewService {
  /**
   * Backwards-compatible flat list for older code. Prefer using `sections`.
   */
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
      label: $localize`:admin menu item:Configure Record Types`,
      link: "/admin/entity",
    },
    {
      label: $localize`:admin menu item:Setup Wizard`,
      link: "/admin/setup-wizard",
    },
    {
      label: $localize`:admin menu item:Configure Main Menu`,
      link: "/admin/menu",
    },
  ];

  private readonly _sections: AdminSection[] = DEFAULT_ADMIN_SECTIONS;

  get sections(): AdminSection[] {
    return this._sections;
  }

  /**
   * Register menu item(s) in a specific section.
   * @param sectionId The ID of the section to add the item(s) to
   * @param items The menu item(s) to add - can be a single item or an array
   */
  addMenuItems(sectionId: string, items: MenuItem | MenuItem[]): void {
    const section = this._sections.find((s) => s.id === sectionId);
    if (section) {
      const itemsArray = Array.isArray(items) ? items : [items];
      section.items.push(...itemsArray);
    } else {
      console.warn(`Admin section with ID "${sectionId}" not found`);
    }
  }

  /**
   * @deprecated Use addMenuItems instead. Kept for backwards compatibility.
   */
  addMenuItem(sectionId: string, item: MenuItem): void {
    this.addMenuItems(sectionId, item);
  }

  /**
   * Set expansion state for a section
   * @param sectionId The ID of the section
   * @param expanded Whether the section should be expanded
   */
  setSectionExpanded(sectionId: string, expanded: boolean): void {
    const section = this._sections.find((s) => s.id === sectionId);
    if (section) {
      section.expanded = expanded;
    }
  }
}
