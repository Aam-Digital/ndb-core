import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { HelpButtonComponent } from "./help-button.component";

export default {
  title: "Core/> App Layout/Help Button",
  decorators: [
    moduleMetadata({
      imports: [HelpButtonComponent, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: StoryFn<HelpButtonComponent> = (args) => ({
  component: HelpButtonComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  text: "This text provides additional, contextual descriptions to the user if needed.",
};
