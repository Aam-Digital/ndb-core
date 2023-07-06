import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { IMPORT_SAMPLE_RAW_DATA } from "../import/import-sample-raw-data";
import { MatInputModule } from "@angular/material/input";
import { ImportService } from "../import.service";
import { BasicAutocompleteComponent } from "../../../core/configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { FormsModule } from "@angular/forms";

export default {
  title: "Features/Import/3 Map Columns",
  component: ImportColumnMappingComponent,
  decorators: [
    moduleMetadata({
      imports: [
        StorybookBaseModule,
        MatInputModule,
        BasicAutocompleteComponent,
        FormsModule,
      ],
      declarations: [ImportColumnMappingComponent],
      providers: [ImportService],
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
  columnMapping: Object.keys(IMPORT_SAMPLE_RAW_DATA[0]).map((column) => ({
    column,
  })),
};
