import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayLongTextComponent } from "./display-long-text.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/number/DisplayUnit",
  component: DisplayLongTextComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayLongTextComponent> = (
  args: DisplayLongTextComponent,
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  value: 5,
  config: "kg",
};

export const Zero = Template.bind({});
Zero.args = {
  value: 0,
  config: "kg",
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
  config: "kg",
};
