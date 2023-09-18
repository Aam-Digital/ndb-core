import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditNumber", 123);

export default {
  title: "Core/Entities/Properties/number/EditNumber",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
