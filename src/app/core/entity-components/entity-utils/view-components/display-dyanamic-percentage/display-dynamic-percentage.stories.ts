import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayDynamicPercentageComponent } from "./display-dynamic-percentage.component";

export default {
  title: "Core/Entities/Display Properties/DisplayDynamicPercentage",
  component: DisplayDynamicPercentageComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayDynamicPercentageComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<DisplayDynamicPercentageComponent> = (
  args: DisplayDynamicPercentageComponent
) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: { allDays: 110, presentDays: 17 },
  config: {
    actual: "presentDays",
    total: "allDays",
    decimalPlaces: 3,
  },
};
