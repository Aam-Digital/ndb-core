import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
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

const Template: Story<HelpButtonComponent> = (args) => ({
  component: HelpButtonComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  text: "This text provides additional, contextual descriptions to the user if needed.",
};
