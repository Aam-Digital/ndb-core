import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayMonthComponent } from "./display-month.component";

export default {
  title: "Core/Entities/Display Properties/DisplayMonth",
  component: DisplayMonthComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayMonthComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<DisplayMonthComponent> = (
  args: DisplayMonthComponent
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
