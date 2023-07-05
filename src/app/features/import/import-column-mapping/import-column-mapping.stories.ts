import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { IMPORT_SAMPLE_RAW_DATA } from "../import/import-sample-raw-data";

export default {
  title: "Features/Import/3 Map Columns",
  component: ImportColumnMappingComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, FontAwesomeModule],
      declarations: [ImportColumnMappingComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<ImportColumnMappingComponent> = (
  args: ImportColumnMappingComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  rawData: IMPORT_SAMPLE_RAW_DATA,
  entityType: "Child",
  columnMapping: [],
};
