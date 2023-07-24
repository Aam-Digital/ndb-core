import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../utils/storybook-base.module";
import { AlertStoriesHelperComponent } from "./alert-stories-helper.component";

export default {
  title: "Core/> App Layout/Alerts",
  component: AlertStoriesHelperComponent,
  decorators: [
    moduleMetadata({
      declarations: [AlertStoriesHelperComponent],
      imports: [StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: StoryFn<AlertStoriesHelperComponent> = (
  args: AlertStoriesHelperComponent,
) => ({
  component: AlertStoriesHelperComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
