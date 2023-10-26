import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayTextComponent } from "./display-text.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/string/DisplayText",
  component: DisplayTextComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayTextComponent> = (
  args: DisplayTextComponent,
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  value: "foo bar",
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
};
