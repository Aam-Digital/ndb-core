import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditText", "some text");

export default {
  title: "Core/Entities/Edit Properties/EditText",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
