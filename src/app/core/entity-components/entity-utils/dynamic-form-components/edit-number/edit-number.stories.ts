import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditNumber", 123);

export default {
  title: "Core/Entities/Edit Properties/EditNumber",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
