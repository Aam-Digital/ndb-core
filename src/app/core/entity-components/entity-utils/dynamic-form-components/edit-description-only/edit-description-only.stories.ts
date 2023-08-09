import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory(
  "EditDescriptionOnly",
  "-",
  false,
);

export default {
  title: "Core/Entities/Edit Properties/EditDescriptionOnly",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
