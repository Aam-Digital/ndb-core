import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayUnitComponent } from "./display-unit.component";

export default {
  title: "Core/Entities/Display Properties/DisplayUnit",
  component: DisplayUnitComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayUnitComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<DisplayUnitComponent> = (args: DisplayUnitComponent) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  value: 5,
  config: "kg",
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
  config: "kg",
};
