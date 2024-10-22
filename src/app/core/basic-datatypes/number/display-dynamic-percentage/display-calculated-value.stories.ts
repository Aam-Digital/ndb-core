import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "app/utils/storybook-base.module";
import { DisplayCalculatedValueComponent } from "./display-calculated-value.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/number/DisplayCalculatedValue",
  component: DisplayCalculatedValueComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayCalculatedValueComponent> = (
  args: DisplayCalculatedValueComponent,
) => ({
  props: args,
});

export const Primary = {
  render: Template,

  args: {
    entity: { allDays: 110, presentDays: 17 },
    config: {
      actual: "presentDays",
      total: "allDays",
      decimalPlaces: 3,
    },
  },
};

export const Zero = {
  render: Template,

  args: {
    entity: { allDays: 110, presentDays: 0 },
    config: {
      actual: "presentDays",
      total: "allDays",
      decimalPlaces: 3,
    },
  },
};
