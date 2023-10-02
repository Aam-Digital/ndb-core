import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { DisplayDynamicPercentageComponent } from "./display-dynamic-percentage.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/number/DisplayDynamicPercentage",
  component: DisplayDynamicPercentageComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayDynamicPercentageComponent> = (
  args: DisplayDynamicPercentageComponent,
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
