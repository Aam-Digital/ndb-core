import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { ComingSoonComponent } from "./coming-soon.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Core/> App Layout/Coming Soon Page",
  component: ComingSoonComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<ComingSoonComponent> = (args: ComingSoonComponent) => ({
  component: ComingSoonComponent,
  props: args,
});

export const Primary = {
  render: Template,
  args: {},
};
