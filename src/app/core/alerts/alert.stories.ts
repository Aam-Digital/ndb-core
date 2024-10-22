import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../utils/storybook-base.module";
import { AlertStoriesHelperComponent } from "./alert-stories-helper.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/> App Layout/Alerts",
  component: AlertStoriesHelperComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<AlertStoriesHelperComponent> = (
  args: AlertStoriesHelperComponent,
) => ({
  component: AlertStoriesHelperComponent,
  props: args,
});

export const Primary = {
  render: Template,
  args: {},
};
