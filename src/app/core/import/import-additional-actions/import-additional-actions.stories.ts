import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";
import {
  IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
  IMPORT_SAMPLE_LINKABLE_DATA,
} from "../import/import-sample-raw-data";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Import/2b Select Additional Actions",
  component: ImportAdditionalActionsComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([...IMPORT_SAMPLE_LINKABLE_DATA]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ImportAdditionalActionsComponent> = (
  args: ImportAdditionalActionsComponent,
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
