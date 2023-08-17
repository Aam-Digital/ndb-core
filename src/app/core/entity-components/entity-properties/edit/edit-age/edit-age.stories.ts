import { generateFormFieldStory } from "../edit-component-story-utils";
import { DateWithAge } from "../../../../../child-dev-project/children/model/dateWithAge";
import { StoryFn } from "@storybook/angular";

const formFieldStory = generateFormFieldStory(
  "EditAge",
  new DateWithAge("2001-01-25"),
);

export default {
  title: "Core/Entities/Edit Properties/EditAge",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
