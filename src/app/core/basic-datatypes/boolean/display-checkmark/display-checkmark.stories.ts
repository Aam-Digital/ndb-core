import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayCheckmarkComponent } from "./display-checkmark.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/boolean/DisplayCheckmark",
  component: DisplayCheckmarkComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayCheckmarkComponent> = (
  args: DisplayCheckmarkComponent,
) => ({
  props: args,
});

export const True = {
  render: Template,

  args: {
    value: true,
  },
};

export const False = {
  render: Template,

  args: {
    value: false,
  },
};

export const WithoutValue = {
  render: Template,

  args: {
    value: undefined,
  },
};
