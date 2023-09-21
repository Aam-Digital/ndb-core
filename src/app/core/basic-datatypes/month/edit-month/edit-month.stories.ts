import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory(
  "EditMonth",
  new Date("2001-01-01"),
);

export default {
  title: "Core/Entities/Properties/date/EditMonth",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
