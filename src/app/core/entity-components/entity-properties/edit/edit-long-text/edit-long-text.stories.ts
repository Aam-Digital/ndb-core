import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditLongText", "abcde\nxyz");

export default {
  title: "Core/Entities/Edit Properties/EditLongText",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
