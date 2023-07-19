import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { Meta, Story } from "@storybook/angular/types-6-0";
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

const Template: Story<UiComponent> = (args: UiComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
