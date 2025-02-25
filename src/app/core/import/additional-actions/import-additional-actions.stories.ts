import { applicationConfig, Meta, StoryFn, StoryObj } from "@storybook/angular";
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

export const Basic: StoryObj<ImportAdditionalActionsComponent> = {
  args: {
    entityType: "Child",
  },
};

export const Disabled: StoryObj<ImportAdditionalActionsComponent> = {
  args: {},
};

export const WithExistingActions: StoryObj<ImportAdditionalActionsComponent> = {
  args: {
    entityType: "Child",
    importActions: IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
  },
};
