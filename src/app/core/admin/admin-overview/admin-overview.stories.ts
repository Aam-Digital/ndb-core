import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { importProvidersFrom } from "@angular/core";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { AdminOverviewComponent } from "./admin-overview.component";
import { AdminOverviewService } from "./admin-overview.service";
import { AlertService } from "../../alerts/alert.service";
import { BackupService } from "../backup/backup.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfigService } from "../../config/config.service";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { DownloadService } from "../../export/download-service/download.service";
import { JsonEditorService } from "../json-editor/json-editor.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { of } from "rxjs";

// Mock services for Storybook
const mockAlertService = {
  alerts: [],
};

const mockBackupService = {
  getDatabaseExport: () => Promise.resolve([]),
  clearDatabase: () => Promise.resolve(),
  restoreData: () => Promise.resolve(),
};

const mockDownloadService = {
  triggerDownload: () => Promise.resolve(),
};

const mockConfirmationDialogService = {
  getConfirmation: () => Promise.resolve(true),
  showProgressDialog: () => ({ close: () => {} }),
};

const mockConfigService = {
  exportConfig: () => "{}",
  saveConfig: () => Promise.resolve(),
};

const mockDatabaseResolverService = {
  getDatabase: () => ({}),
};

const mockJsonEditorService = {
  openJsonEditorDialog: () => of(null),
};

const mockEntityMapperService = {
  save: () => Promise.resolve(),
  remove: () => Promise.resolve(),
  load: () => Promise.resolve(),
};

const mockSnackBar = {
  open: () => ({
    onAction: () => of(null),
  }),
};

export default {
  title: "Core/Admin/Admin Overview",
  component: AdminOverviewComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      imports: [AdminOverviewComponent],
      providers: [
        AdminOverviewService,
        { provide: AlertService, useValue: mockAlertService },
        { provide: BackupService, useValue: mockBackupService },
        { provide: DownloadService, useValue: mockDownloadService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialogService,
        },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: DatabaseResolverService,
          useValue: mockDatabaseResolverService,
        },
        { provide: JsonEditorService, useValue: mockJsonEditorService },
        { provide: EntityMapperService, useValue: mockEntityMapperService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<AdminOverviewComponent> = (args) => ({
  component: AdminOverviewComponent,
  props: args,
});

export const Primary = {
  render: Template,
  args: {},
};

export const WithExtendedSections = {
  render: Template,
  args: {},
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: AdminOverviewService,
          useValue: {
            sections: [
              {
                id: "subscription",
                title: "Subscription",
                description:
                  "Set up the core elements that define how your system works and communicates.",
                expanded: false,
                items: [
                  {
                    label: "Subscription Info",
                    link: "/admin/subscription-info",
                  },
                  {
                    label: "Advanced Features",
                    link: "/admin/advanced-features",
                  },
                  { label: "Data Privacy", link: "/admin/data-privacy" },
                ],
              },
              {
                id: "configuration",
                title: "Configuration and Site-wide Settings",
                description:
                  "Set up the core elements that define how your system works and communicates.",
                expanded: true,
                items: [
                  { label: "Site Settings", link: "/admin/site-settings" },
                  {
                    label: "Data Structures & Entity Types",
                    link: "/admin/entity",
                  },
                  { label: "Main Navigation Menu", link: "/admin/menu" },
                  { label: "Setup Wizard", link: "/admin/setup-wizard" },
                  { label: "Custom Field 1", link: "/admin/custom1" },
                  { label: "Custom Field 2", link: "/admin/custom2" },
                ],
              },
              {
                id: "templates",
                title: "Templates and Forms",
                description:
                  "Define user access, site configuration, and initial setup.",
                expanded: false,
                items: [
                  { label: "Email Templates", link: "/admin/email-templates" },
                  {
                    label: "Export Templates (PDF Generation)",
                    link: "/admin/export-templates",
                  },
                  { label: "Public Forms", link: "/admin/public-forms" },
                ],
              },
              {
                id: "user-management",
                title: "User Management",
                description:
                  "Setup integrations, application data, and system diagnostics.",
                expanded: false,
                items: [
                  { label: "User Roles", link: "/admin/user-roles" },
                  {
                    label: "Manage User Accounts",
                    link: "/user",
                  },
                ],
              },
              {
                id: "export-backups",
                title: "Export and Backups",
                description:
                  "Manage data privacy, security controls and audit trails.",
                expanded: false,
                items: [],
              },
              {
                id: "technical",
                title: "Technical Administration",
                description:
                  "Find helpful articles and documentation to guide your setup and manage system effectively.",
                expanded: false,
                items: [
                  { label: "Database Conflicts", link: "/admin/conflicts" },
                ],
              },
            ],
            addMenuItems: () => {},
            addMenuItem: () => {},
          },
        },
      ],
    }),
  ],
};
