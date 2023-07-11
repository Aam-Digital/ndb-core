import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportReviewDataComponent } from "./import-review-data.component";
import {
  IMPORT_SAMPLE_COLUMN_MAPPING,
  IMPORT_SAMPLE_RAW_DATA,
} from "../import/import-sample-raw-data";
import { ImportService } from "../import.service";
import { EntitySubrecordComponent } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { MatButtonModule } from "@angular/material/button";
import { HelpButtonComponent } from "../../../core/common-components/help-button/help-button.component";

export default {
  title: "Features/Import/4 Review & Edit Data",
  component: ImportReviewDataComponent,
  decorators: [
    moduleMetadata({
      imports: [
        StorybookBaseModule,
        EntitySubrecordComponent,
        MatButtonModule,
        HelpButtonComponent,
      ],
      declarations: [ImportReviewDataComponent],
      providers: [ImportService],
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
  columnMapping: IMPORT_SAMPLE_COLUMN_MAPPING,
};
