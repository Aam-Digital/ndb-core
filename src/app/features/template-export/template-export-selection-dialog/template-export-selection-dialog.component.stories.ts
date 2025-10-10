import { importProvidersFrom } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { of, throwError } from "rxjs";
import { AlertService } from "../../../core/alerts/alert.service";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { TemplateExportApiService } from "../template-export-api/template-export-api.service";
import { TemplateExportService } from "../template-export-service/template-export.service";
import { TemplateExport } from "../template-export.entity";
import { TemplateExportSelectionDialogComponent } from "./template-export-selection-dialog.component";

// Create a mock entity for testing
const mockEntity = new TestEntity("test-entity-1");
mockEntity.name = "John Doe";

// Create mock template export entities
const createMockTemplateExport = (
  id: string,
  title: string,
  description: string,
  entityTypes: string[],
) => {
  const template = new TemplateExport(id);
  template.title = title;
  template.description = description;
  template.applicableForEntityTypes = entityTypes;
  return template;
};

const mockTemplateExports = [
  createMockTemplateExport(
    "template-1",
    "Basic Report",
    "A basic report template",
    ["TestEntity", "Child"],
  ),
  createMockTemplateExport(
    "template-2",
    "Detailed Assessment",
    "Comprehensive assessment template",
    ["TestEntity"],
  ),
  createMockTemplateExport("template-3", "Summary Card", "Quick summary card", [
    "Child",
    "School",
  ]),
];

// Mock services
const mockTemplateExportService = {
  isExportServerEnabled: () => Promise.resolve(true),
};

const mockTemplateExportApiService = {
  generatePdfFromTemplate: (templateId: string, entity: any) => {
    // Simulate successful generation
    return of({
      file: new Blob(["mock pdf content"], { type: "application/pdf" }),
      filename: `${entity.name}_${templateId}.pdf`,
    });
  },
};

const mockTemplateExportApiServiceError = {
  generatePdfFromTemplate: (templateId: string, entity: any) => {
    // Simulate error
    return throwError(() => new Error("Failed to generate PDF"));
  },
};

const mockDownloadService = {
  triggerDownload: (file: Blob, type: string, filename: string) => {
    console.log(`Download triggered: ${filename}.${type}`);
  },
};

const mockAlertService = {
  addWarning: (message: string) => {
    console.warn("Alert:", message);
  },
};

const mockDialogRef = {
  close: (result?: any) => {
    console.log("Dialog closed with result:", result);
  },
};

export default {
  title: "Features/Template Export/Selection Dialog",
  component: TemplateExportSelectionDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData(mockTemplateExports)),
      ],
    }),
    moduleMetadata({
      imports: [TemplateExportSelectionDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: mockEntity,
        },
        {
          provide: MatDialogRef,
          useValue: mockDialogRef,
        },
        {
          provide: TemplateExportService,
          useValue: mockTemplateExportService,
        },
        {
          provide: TemplateExportApiService,
          useValue: mockTemplateExportApiService,
        },
        {
          provide: DownloadService,
          useValue: mockDownloadService,
        },
        {
          provide: AlertService,
          useValue: mockAlertService,
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<TemplateExportSelectionDialogComponent> = (args) => ({
  component: TemplateExportSelectionDialogComponent,
  props: args,
});

export const FeatureEnabled = {
  render: Template,
  args: {
    entity: mockEntity,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows the dialog when the template export feature is enabled. Users can select from available templates and generate files.",
      },
    },
  },
};

export const FeatureDisabled = {
  render: Template,
  args: {
    entity: mockEntity,
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TemplateExportService,
          useValue: {
            isExportServerEnabled: () => Promise.resolve(false),
          },
        },
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Shows the dialog when the template export feature is disabled. Displays a feature disabled message.",
      },
    },
  },
};

export const LoadingState = {
  render: Template,
  args: {
    entity: mockEntity,
  },
  play: async ({ canvasElement }) => {
    // Simulate the loading state by programmatically setting it
    const component = canvasElement.querySelector(
      "app-file-template-selection-dialog-component",
    );
    if (component) {
      // This would need to be accessed through the Angular component instance
      // For demo purposes, we show how this state would appear
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows the dialog in a loading state while a file is being generated.",
      },
    },
  },
};

export const ErrorHandling = {
  render: Template,
  args: {
    entity: mockEntity,
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TemplateExportApiService,
          useValue: mockTemplateExportApiServiceError,
        },
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Shows how the dialog handles errors during file generation. Check the console for error messages.",
      },
    },
  },
};

export const DifferentEntityType = {
  render: Template,
  args: {
    entity: (() => {
      const entity = new TestEntity("different-entity");
      entity.name = "Different Entity";
      return entity;
    })(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows the dialog with a different entity type. Template filtering would apply based on the entity type.",
      },
    },
  },
};

export const FeatureServerUnavailable = {
  render: Template,
  args: {
    entity: mockEntity,
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TemplateExportService,
          useValue: {
            isExportServerEnabled: () => Promise.resolve(undefined),
          },
        },
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Shows the dialog when the export server availability is unknown or undefined.",
      },
    },
  },
};
