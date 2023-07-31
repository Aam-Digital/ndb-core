import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayCheckmarkComponent } from "./display-checkmark.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Display Properties/DisplayCheckmark",
  component: DisplayCheckmarkComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayCheckmarkComponent> = (
  args: DisplayCheckmarkComponent,
) => ({
  props: args,
});

export const True = Template.bind({});
True.args = {
  value: true,
};

export const False = Template.bind({});
False.args = {
  value: false,
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
};
