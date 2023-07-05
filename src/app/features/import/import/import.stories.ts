import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ImportModule } from "../import.module";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportComponent } from "./import.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
  IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
  IMPORT_SAMPLE_LINKABLE_DATA,
  IMPORT_SAMPLE_RAW_DATA,
} from "./import-sample-raw-data";
import { EntityTypeLabelPipe } from "../../../core/entity-components/entity-type-label/entity-type-label.pipe";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";

export default {
  title: "Features/Import/> Overall Module",
  component: ImportComponent,
  decorators: [
    moduleMetadata({
      imports: [ImportModule, StorybookBaseModule, FontAwesomeModule],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(IMPORT_SAMPLE_LINKABLE_DATA),
        },
        EntityTypeLabelPipe,
      ],
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
  additionalImportActions: IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
};
