import { applicationConfig, Meta, StoryFn, StoryObj } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import {
  IMPORT_SAMPLE_COLUMN_MAPPING,
  IMPORT_SAMPLE_RAW_DATA,
} from "../import/import-sample-raw-data";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Import/3 Map Columns",
  component: ImportColumnMappingComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

export const Basic: StoryObj<ImportColumnMappingComponent> = {
  args: {
    rawData: IMPORT_SAMPLE_RAW_DATA,
    entityType: "Child",
    columnMapping: Object.keys(IMPORT_SAMPLE_RAW_DATA[0]).map((column) => ({
      column,
    })),
  },
};

export const WithSampleMapping: StoryObj<ImportColumnMappingComponent> = {
  args: {
    rawData: IMPORT_SAMPLE_RAW_DATA,
    entityType: "Child",
    columnMapping: IMPORT_SAMPLE_COLUMN_MAPPING,
  },
};
