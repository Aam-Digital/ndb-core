import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditBoolean", true);

export default {
  title: "Core/Entities/Edit Properties/EditBoolean",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Checked = Template.bind({});

export const Unchecked = Template.bind({});
const entity = new formFieldStory.entityType();
entity.main = false;
Unchecked.args = {
  entity: entity,
};
