import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { UiComponent } from "./ui.component";

export default {
  title: "Core/> App Layout/> Overall Layout",
  component: UiComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, UiComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: StoryFn<UiComponent> = (args: UiComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
