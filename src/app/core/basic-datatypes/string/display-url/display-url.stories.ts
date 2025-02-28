import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { DisplayUrlComponent } from "./display-url.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/Entities/Properties/url/DisplayUrl",
  component: DisplayUrlComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayUrlComponent> = (args: DisplayUrlComponent) => ({
  props: args,
});

export const Basic = {
  render: Template,

  args: {
    value: "https://github.com/Aam-Digital/ndb-core/issues/2460",
  },
};

export const WithoutValue = {
  render: Template,

  args: {
    value: undefined,
  },
};
