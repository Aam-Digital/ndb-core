import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";
import { StoryFn } from "@storybook/angular";
import { DateWithAge } from "../dateWithAge";

const formFieldStory = generateFormFieldStory(
  "EditAge",
  new DateWithAge("2001-01-25"),
);

export default {
  title: "Core/Entities/Properties/date/EditAge",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = {
  render: Template,
};
