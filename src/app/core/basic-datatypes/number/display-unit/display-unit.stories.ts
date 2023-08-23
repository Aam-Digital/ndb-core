import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayUnitComponent } from "./display-unit.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Display Properties/DisplayUnit",
  component: DisplayUnitComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayUnitComponent> = (
  args: DisplayUnitComponent,
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  value: 5,
  config: "kg",
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
  config: "kg",
};
