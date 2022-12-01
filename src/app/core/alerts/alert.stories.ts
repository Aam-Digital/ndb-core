import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { AlertsModule } from "./alerts.module";
import { StorybookBaseModule } from "../../utils/storybook-base.module";
import { AlertStoriesHelperComponent } from "./alert-stories-helper.component";

export default {
  title: "Core/Alerts",
  component: AlertStoriesHelperComponent,
  decorators: [
    moduleMetadata({
      declarations: [AlertStoriesHelperComponent],
      imports: [StorybookBaseModule, AlertsModule],
    }),
  ],
} as Meta;

const Template: Story<AlertStoriesHelperComponent> = (
  args: AlertStoriesHelperComponent
) => ({
  component: AlertStoriesHelperComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
