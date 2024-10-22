import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportComponent } from "./import.component";
import {
  IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
  IMPORT_SAMPLE_COLUMN_MAPPING,
  IMPORT_SAMPLE_LINKABLE_DATA,
  IMPORT_SAMPLE_PREVIOUS_IMPORTS,
  IMPORT_SAMPLE_RAW_DATA,
} from "./import-sample-raw-data";
import { importProvidersFrom } from "@angular/core";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { Entity } from "../../entity/model/entity";

export default {
  title: "Features/Import/> Overall Module",
  component: ImportComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            ...IMPORT_SAMPLE_LINKABLE_DATA,
            ...IMPORT_SAMPLE_PREVIOUS_IMPORTS,
            Object.assign(new Entity(TEST_USER), { name: TEST_USER }),
          ]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ImportComponent> = (args: ImportComponent) => ({
  props: args,
});

export const Basic = {
  render: Template,
  args: {},
};

export const WithSampleData = {
  render: Template,

  args: {
    rawData: IMPORT_SAMPLE_RAW_DATA,
    entityType: "Child",
    additionalImportActions: IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
    columnMapping: IMPORT_SAMPLE_COLUMN_MAPPING,
  },
};
