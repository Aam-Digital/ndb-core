import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../core/entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditFile", undefined);

export default {
  title: "Core/Entities/Properties/file/EditFile",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = {
  render: Template,
};
