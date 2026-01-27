import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportReviewDataComponent } from "./import-review-data.component";
import {
  IMPORT_SAMPLE_COLUMN_MAPPING,
  IMPORT_SAMPLE_RAW_DATA,
} from "../import/import-sample-raw-data";
import { importProvidersFrom } from "@angular/core";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";

const existingEntity = createEntityOfType("Child", "1");
existingEntity["name"] = IMPORT_SAMPLE_RAW_DATA[0]["name"];
existingEntity["_rev"] = "001";

export default {
  title: "Features/Import/4 Review & Edit Data",
  component: ImportReviewDataComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData([existingEntity])),
      ],
    }),
  ],
} as Meta;

export const Preview: StoryObj<ImportReviewDataComponent> = {
  args: {
    rawData: IMPORT_SAMPLE_RAW_DATA,
    entityType: "Child",
    columnMapping: IMPORT_SAMPLE_COLUMN_MAPPING,
    importExisting: { matchExistingByFields: ["name"] },
  },
};

export const Loading: StoryObj<ImportReviewDataComponent> = {
  args: {
    isLoading: true,
  },
};
