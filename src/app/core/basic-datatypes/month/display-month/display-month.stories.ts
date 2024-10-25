import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayMonthComponent } from "./display-month.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/date/DisplayMonth",
  component: DisplayMonthComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayMonthComponent> = (
  args: DisplayMonthComponent,
) => ({
  props: args,
});

export const Basic = {
  render: Template,

  args: {
    value: new Date("2023-06-19"),
  },
};

export const WithoutValue = {
  render: Template,

  args: {
    value: undefined,
  },
};
