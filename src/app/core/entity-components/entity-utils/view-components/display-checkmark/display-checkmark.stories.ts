import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DisplayCheckmarkComponent } from "./display-checkmark.component";

export default {
  title: "Core/Entities/Display Properties/DisplayCheckmark",
  component: DisplayCheckmarkComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayCheckmarkComponent],
      providers: [],
    }),
  ],
} as Meta;

const Template: StoryFn<DisplayCheckmarkComponent> = (
  args: DisplayCheckmarkComponent,
) => ({
  props: args,
});

export const True = Template.bind({});
True.args = {
  value: true,
};

export const False = Template.bind({});
False.args = {
  value: false,
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  value: undefined,
};
