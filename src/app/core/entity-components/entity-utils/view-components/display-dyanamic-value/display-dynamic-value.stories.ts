import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayDynamicValueComponent } from "./display-dynamic-value.component";
import { DateWithAge } from "../../../../../child-dev-project/children/model/dateWithAge";

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

const date = new DateWithAge("2001-12-25");
// currently Storybook can't handle classes extending Date - so this doesn't work: https://github.com/storybookjs/storybook/issues/14618

export const Summarize = Template.bind({});
Summarize.args = {
  entity: {totalDays: 10, activeDays: 5},
  config: {
    properties: ["totalDays", "activeDays"],
    calculation: "summarize"
  }
};

export const Percentage = Template.bind({});
Percentage.args = {
  entity: {totalDays: 10, activeDays: 5},
  config: {
    properties: ["totalDays", "activeDays"],
    calculation: "percentage"
  }
};




export const WithoutValue = Template.bind({});
WithoutValue.args = {
  config: "dateOfBirth",
  entity: {},
};
