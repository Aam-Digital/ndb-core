import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../core/entity/entity-field-edit/dynamic-edit/edit-component-story-utils";
import { GeoLocation } from "../geo-location";

const formFieldStory = generateFormFieldStory("EditLocation", {
  locationString: "some custom address",
} as GeoLocation);

export default {
  title: "Features/Location/EditLocation",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = {
  render: Template,
};
