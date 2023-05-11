import { Story } from "@storybook/angular/types-6-0";
import { generateFormFieldStory } from "../edit-component-story-utils";
import { DateWithAge } from "../../../../../child-dev-project/children/model/dateWithAge";

const formFieldStory = generateFormFieldStory(
  "EditAge",
  new DateWithAge("2001-01-25")
);

export default formFieldStory.meta;
const Template: Story = (args) => ({
  props: args,
});

export const Primary = Template.bind({});
