import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ComingSoonComponent } from "./coming-soon.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";

export default {
  title: "Core/ComingSoonPage",
  component: ComingSoonComponent,
  decorators: [
    moduleMetadata({
      imports: [ComingSoonComponent, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: Story<ComingSoonComponent> = (args: ComingSoonComponent) => ({
  component: ComingSoonComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
