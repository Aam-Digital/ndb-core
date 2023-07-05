import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ImportModule } from "../import.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportComponent } from "./import.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IMPORT_SAMPLE_RAW_DATA } from "./import-sample-raw-data";

export default {
  title: "Features/Import/> Overall Module",
  component: ImportComponent,
  decorators: [
    moduleMetadata({
      imports: [ImportModule, StorybookBaseModule, FontAwesomeModule],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportComponent> = (args: ImportComponent) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};

export const WithSampleData = Template.bind({});
WithSampleData.args = {
  rawData: IMPORT_SAMPLE_RAW_DATA,
  entityType: "Child",
};
