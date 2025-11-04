import { Injectable } from "@angular/core";
import { MenuItem } from "../../ui/navigation/menu-item";

export interface AdminSection {
  id: string;
  title: string;
  description?: string;
  expanded?: boolean;
  items: MenuItem[];
}

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
      label: $localize`:admin menu item:Configure Entity Types`,
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

  private readonly _sections: AdminSection[] = [
    {
      id: "subscription",
      title: $localize`:admin section:Subscription (only to be visible in SAAS hosting environment)`,
      description: $localize`:admin section description:Manage your subscription details, privacy settings, and access to advanced features.`,
      expanded: false,
      items: [
        {
          label: $localize`:admin menu item:Subscription Info`,
          link: "/admin/subscription-info",
        },
        {
          label: $localize`:admin menu item:Advanced Features`,
          link: "/admin/advanced-features",
        },
        {
          label: $localize`:admin menu item:Data Privacy`,
          link: "/admin/data-privacy",
        },
      ],
    },
    {
      id: "configuration",
      title: $localize`:admin section:Configuration and Site Wide Settings`,
      description: $localize`:admin section description:Set up the essential elements that shape your site's structure and system behaviour.`,
      expanded: true,
      items: [
        {
          label: $localize`:admin menu item:Site Settings`,
          link: "/admin/site-settings",
        },
        {
          label: $localize`:admin menu item:Data Structures & Entity Types`,
          link: "/admin/entity",
        },
        {
          label: $localize`:admin menu item:Main Navigation Menu`,
          link: "/admin/menu",
        },
        {
          label: $localize`:admin menu item:Setup Wizard`,
          link: "/admin/setup-wizard",
        },
      ],
    },
    {
      id: "templates",
      title: $localize`:admin section:Templates and Forms`,
      description: $localize`:admin section description:Customise your templates and forms.`,
      expanded: false,
      items: [
        // This section is populated dynamically by feature modules:
        // - EmailClientServiceModule adds "Manage Email Templates"
        // - TemplateExportModule adds "Configure Export Templates"
        // - PublicFormModule adds "Configure Public Forms"
      ],
    },
    {
      id: "user-management",
      title: $localize`:admin section:User Management`,
      description: $localize`:admin section description:Set up and manage user accounts, roles, and permissions.`,
      expanded: false,
      items: [
        {
          label: $localize`:admin menu item:User Roles`,
          link: "/admin/user-roles",
        },
        {
          label: $localize`:admin menu item:Manage User Accounts`,
          link: "/user",
        },
      ],
    },
    {
      id: "export-backups",
      title: $localize`:admin section:Export and Backups`,
      description: $localize`:admin section description:Define how your system keeps data protected and accessible.`,
      expanded: false,
      items: [
        // This section uses special template content with functional buttons
        // See admin-overview.component.html for the actual implementation
      ],
    },
    {
      id: "technical",
      title: $localize`:admin section:Technical Administration`,
      description: $localize`:admin section description:Manage advanced technical options for maintaining and troubleshooting your system.`,
      expanded: false,
      items: [
        // Most items in this section use special template content with functional buttons
        // Regular navigation items can be added here:
        {
          label: $localize`:admin menu item:Database Conflicts`,
          link: "/admin/conflicts",
        },
      ],
    },
  ];

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
