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
import { AdminSection } from "./admin-section.interface";
import { DEFAULT_ADMIN_SECTIONS } from "./admin-overview-sections";
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

// Create extended sections for story demonstration
const EXTENDED_SECTIONS: AdminSection[] = [
  ...DEFAULT_ADMIN_SECTIONS.map((section) => {
    if (section.id === "configuration") {
      return {
        ...section,
        items: [
          ...section.items,
          { label: "Custom Field 1", link: "/admin/custom1" },
          { label: "Custom Field 2", link: "/admin/custom2" },
        ],
      };
    }
    if (section.id === "templates") {
      return {
        ...section,
        items: [
          { label: "Email Templates", link: "/admin/email-templates" },
          {
            label: "Export Templates (PDF Generation)",
            link: "/admin/export-templates",
          },
          { label: "Public Forms", link: "/admin/public-forms" },
        ],
      };
    }
    return section;
  }),
];

export const WithExtendedSections = {
  render: Template,
  args: {},
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: AdminOverviewService,
          useValue: {
            sections: EXTENDED_SECTIONS,
            addMenuItems: () => {},
            addMenuItem: () => {},
            setSectionExpanded: () => {},
          },
        },
      ],
    }),
  ],
};
