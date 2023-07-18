import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import {
  IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
  IMPORT_SAMPLE_LINKABLE_DATA,
} from "../import/import-sample-raw-data";

export default {
  title: "Features/Import/2b Select Additional Actions",
  component: ImportAdditionalActionsComponent,
  decorators: [
    moduleMetadata({
      imports: [ImportAdditionalActionsComponent, StorybookBaseModule],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(IMPORT_SAMPLE_LINKABLE_DATA),
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<ImportAdditionalActionsComponent> = (
  args: ImportAdditionalActionsComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  entityType: "Child",
};

export const Disabled = Template.bind({});
Disabled.args = {};

export const WithExistingActions = Template.bind({});
WithExistingActions.args = {
  entityType: "Child",
  importActions: IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
};
