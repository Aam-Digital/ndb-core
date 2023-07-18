import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportFileComponent } from "./import-file.component";
import { IMPORT_SAMPLE_RAW_DATA } from "../import/import-sample-raw-data";

export default {
  title: "Features/Import/1 Select File",
  component: ImportFileComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, FontAwesomeModule, ImportFileComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportFileComponent> = (args: ImportFileComponent) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};

export const WithSampleData = Template.bind({});
WithSampleData.args = {
  data: IMPORT_SAMPLE_RAW_DATA,
};
