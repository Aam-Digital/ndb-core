import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditLongText", "abcde\nxyz");

export default {
  title: "Core/Entities/Properties/string/EditLongText",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = {
  render: Template,
};
