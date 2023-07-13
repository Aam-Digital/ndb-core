import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayDynamicValueComponent } from "./display-dynamic-value.component";

export default {
  title: "Core/Entities/Display Properties/DisplayDynamicValue",
  component: DisplayDynamicValueComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayDynamicValueComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<DisplayDynamicValueComponent> = (
  args: DisplayDynamicValueComponent
) => ({
  props: args,
});

export const Summarize = Template.bind({});
Summarize.args = {
  data: [10, 5],
  config: {
    properties: [],
    calculation: "summarize",
  },
};

export const Percentage = Template.bind({});
Percentage.args = {
  data: { total: 110, part: 5 },
  config: {
    calculation: "percentage",
  },
};
