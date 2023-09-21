import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportFileComponent } from "./import-file.component";
import { IMPORT_SAMPLE_RAW_DATA } from "../import/import-sample-raw-data";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Import/1 Select File",
  component: ImportFileComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<ImportFileComponent> = (args: ImportFileComponent) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};

export const WithSampleData = Template.bind({});
WithSampleData.args = {
  data: IMPORT_SAMPLE_RAW_DATA,
};
