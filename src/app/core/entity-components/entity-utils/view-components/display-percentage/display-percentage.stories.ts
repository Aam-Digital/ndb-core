import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { DisplayPercentageComponent } from "./display-percentage.component";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";

export default {
  title: "Core/Entities/Display Properties/DisplayPercentage",
  component: DisplayPercentageComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayPercentageComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<DisplayPercentageComponent> = (
  args: DisplayPercentageComponent
) => ({
  props: args,
});

export const Low = Template.bind({});
Low.args = {
  value: 5,
};
export const Medium = Template.bind({});
Medium.args = {
  value: 49,
};
export const High = Template.bind({});
High.args = {
  value: 100,
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
};
