import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportReviewDataComponent } from "./import-review-data.component";
import { IMPORT_SAMPLE_RAW_DATA } from "../import/import-sample-raw-data";

export default {
  title: "Features/Import/4 Review & Edit Data",
  component: ImportReviewDataComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, FontAwesomeModule],
      declarations: [ImportReviewDataComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportReviewDataComponent> = (
  args: ImportReviewDataComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  rawData: IMPORT_SAMPLE_RAW_DATA,
  entityType: "Child",
  columnMapping: [],
};
