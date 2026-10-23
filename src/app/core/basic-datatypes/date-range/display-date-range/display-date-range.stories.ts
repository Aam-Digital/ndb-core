import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayDateRangeComponent } from "./display-date-range.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/date/DisplayDateRange",
  component: DisplayDateRangeComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayDateRangeComponent> = (args) => ({
  props: args,
});

export const Basic = {
  render: Template,

  args: {
    value: { start: new Date(2026, 2, 1), end: new Date(2026, 4, 31) },
  },
};

export const OnlyStart = {
  render: Template,

  args: {
    value: { start: new Date(2026, 2, 1) },
  },
};

export const WithoutValue = {
  render: Template,

  args: {
    value: undefined,
  },
};
