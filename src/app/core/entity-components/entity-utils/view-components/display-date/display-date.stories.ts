import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayDateComponent } from "./display-date.component";

export default {
  title: "Core/Entities/Display Properties/DisplayDate",
  component: DisplayDateComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayDateComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<DisplayDateComponent> = (args: DisplayDateComponent) => ({
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
