import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayDateComponent } from "./display-date.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/date/DisplayDate",
  component: DisplayDateComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayDateComponent> = (
  args: DisplayDateComponent,
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  value: new Date("2023-06-19"),
};

export const CustomFormat = Template.bind({});
CustomFormat.args = {
  value: new Date("2023-06-19"),
  config: "YYYY-MM-dd",
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
};
