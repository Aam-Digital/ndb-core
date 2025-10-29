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
      title: $localize`:admin section:Subscription (SaaS only)`,
      description: $localize`:admin section description:Set up the core elements that define how your system works and communicates.`,
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
      title: $localize`:admin section:Configuration and Site-wide Settings`,
      description: $localize`:admin section description:Set up the core elements that define how your system works and communicates.`,
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
      description: $localize`:admin section description:Define user access, site configuration, and initial setup.`,
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
      description: $localize`:admin section description:Setup integrations, application data, and system diagnostics.`,
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
      description: $localize`:admin section description:Manage data privacy, security controls and audit trails.`,
      expanded: false,
      items: [
        // This section uses special template content with functional buttons
        // See admin-overview.component.html for the actual implementation
      ],
    },
    {
      id: "technical",
      title: $localize`:admin section:Technical Administration`,
      description: $localize`:admin section description:Find helpful articles and documentation to guide your setup and manage system effectively.`,
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
}
