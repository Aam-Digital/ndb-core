import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { InstallAppPromptComponent } from "./install-app-prompt.component";
import { UsageTipsModule } from "../usage-tips.module";

export default {
  title: "core/usage-tips/InstallAppPrompt",
  component: InstallAppPromptComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, UsageTipsModule],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<InstallAppPromptComponent> = (
  args: InstallAppPromptComponent
) => ({
  component: InstallAppPromptComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
