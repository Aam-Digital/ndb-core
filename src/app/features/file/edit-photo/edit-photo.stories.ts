import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../core/entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditPhoto", undefined);

export default {
  title: "Core/Entities/Edit Properties/EditPhoto",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
