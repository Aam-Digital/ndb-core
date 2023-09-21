import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditBoolean", true);

export default {
  title: "Core/Entities/Properties/boolean/EditBoolean",
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
