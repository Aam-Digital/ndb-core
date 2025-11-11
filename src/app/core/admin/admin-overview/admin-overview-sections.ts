import { AdminSection } from "./admin-section.interface";

/**
 * Default admin sections configuration for the Admin Overview page.
 * These sections organize administrative functions into logical groups
 * with expandable accordions for better navigation.
 */
export const DEFAULT_ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "subscription",
    title: $localize`:admin section:Subscription`,
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
