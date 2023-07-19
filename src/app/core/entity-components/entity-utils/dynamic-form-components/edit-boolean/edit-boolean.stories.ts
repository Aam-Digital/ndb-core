import { Story } from "@storybook/angular/types-6-0";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditBoolean", true);

export default formFieldStory.meta;
const Template: Story = (args) => ({
  props: args,
});

export const Checked = Template.bind({});

export const Unchecked = Template.bind({});
const entity = new formFieldStory.entityType();
entity.main = false;
Unchecked.args = {
  entity: entity,
};
