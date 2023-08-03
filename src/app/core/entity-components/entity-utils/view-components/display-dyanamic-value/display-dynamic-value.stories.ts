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

export const Primary = Template.bind({});
Primary.args = {
  entity: { allDays: 110, presentDays: 5 },
  config: {
    actual: "presentDays",
    total: "allDays",
    decimalPlaces: 2,
  },
};
