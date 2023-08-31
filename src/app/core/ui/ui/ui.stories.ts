import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { UiComponent } from "./ui.component";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/> App Layout/> Overall Layout",
  component: UiComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<UiComponent> = (args: UiComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
