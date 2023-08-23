import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../../core/entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory(
  "EditRecurringInterval",
  undefined,
  true,
  [
    { label: "every week", interval: { value: 1, unit: "week" } },
    { label: "every two weeks", interval: { value: 2, unit: "week" } },
  ],
);

export default {
  title: "Features/Todos/Recurring Interval",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
