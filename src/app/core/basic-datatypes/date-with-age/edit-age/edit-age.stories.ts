import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";
import { DateWithAge } from "../../../../child-dev-project/children/model/dateWithAge";
import { StoryFn } from "@storybook/angular";

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

export const Primary = Template.bind({});
