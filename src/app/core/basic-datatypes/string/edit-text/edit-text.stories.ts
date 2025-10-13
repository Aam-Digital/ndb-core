import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditText", "some text");

export default {
  title: "Core/Entities/Properties/string/EditText",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = {
  render: Template,
};
