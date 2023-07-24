import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { ComingSoonComponent } from "./coming-soon.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Core/> App Layout/Coming Soon Page",
  component: ComingSoonComponent,
  decorators: [
    moduleMetadata({
      imports: [ComingSoonComponent, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: StoryFn<ComingSoonComponent> = (args: ComingSoonComponent) => ({
  component: ComingSoonComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
