import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../edit-component-story-utils";

const formFieldStory = generateFormFieldStory(
  "EditDate",
  new Date("2001-01-25"),
);

export default {
  title: "Core/Entities/Edit Properties/EditDate",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
