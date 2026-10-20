import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditDateRange", {
  start: new Date(2026, 2, 1),
  end: new Date(2026, 4, 31),
});

export default {
  title: "Core/Entities/Properties/date/EditDateRange",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = {
  render: Template,
};
