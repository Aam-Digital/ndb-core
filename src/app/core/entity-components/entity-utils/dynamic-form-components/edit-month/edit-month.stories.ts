import { Story } from "@storybook/angular/types-6-0";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory(
  "EditMonth",
  new Date("2001-01-01")
);

export default formFieldStory.meta;
const Template: Story = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
