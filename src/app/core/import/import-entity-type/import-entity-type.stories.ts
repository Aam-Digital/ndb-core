import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportEntityTypeComponent } from "./import-entity-type.component";
import { importProvidersFrom } from "@angular/core";
import { APP_INITIALIZER_PROPAGATE_CONFIG_UPDATES } from "../../config/config.app-initializer";

export default {
  title: "Features/Import/2 Select Entity Type",
  component: ImportEntityTypeComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule),
        APP_INITIALIZER_PROPAGATE_CONFIG_UPDATES,
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ImportEntityTypeComponent> = (
  args: ImportEntityTypeComponent,
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {};
