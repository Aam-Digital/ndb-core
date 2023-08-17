import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../core/entity-components/entity-properties/edit/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditLocation", {
  display_name: "some address",
});
export default {
  title: "Features/Location/EditLocation",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
