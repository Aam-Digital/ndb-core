import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayMonthComponent } from "./display-month.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Display Properties/DisplayMonth",
  component: DisplayMonthComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayMonthComponent> = (
  args: DisplayMonthComponent,
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  value: new Date("2023-06-19"),
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
};
