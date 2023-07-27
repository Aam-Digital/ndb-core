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
import { User } from "../../../core/user/user";
import { TEST_USER } from "../../../utils/mocked-testing.module";
import { importProvidersFrom } from "@angular/core";

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
            Object.assign(new User(TEST_USER), { name: TEST_USER }),
          ]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ImportComponent> = (args: ImportComponent) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};

export const WithSampleData = Template.bind({});
WithSampleData.args = {
  rawData: IMPORT_SAMPLE_RAW_DATA,
  entityType: "Child",
  additionalImportActions: IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
  columnMapping: IMPORT_SAMPLE_COLUMN_MAPPING,
};
