import { Story } from "@storybook/angular/types-6-0";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditLongText", "abcde\nxyz");

export default formFieldStory.meta;
const Template: Story = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
