import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory(
  "EditUrl",
  "https://github.com/Aam-Digital/ndb-core/issues/2460",
);

export default {
  title: "Core/Entities/Properties/url/EditUrl",
  ...formFieldStory.meta,
};

const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = {
  render: Template,
  args: {
    label: "URL",
    formControl: {
      value: "https://github.com/Aam-Digital/ndb-core/issues/2460",
      disabled: false,
    },
  },
};

export const DisabledWithClickableLink = {
  render: Template,
  args: {
    label: "URL",
    formControl: {
      value: "https://github.com/Aam-Digital/ndb-core/issues/2460",
      disabled: true,
    },
  },
};

export const InvalidUrl = {
  render: Template,
  args: {
    label: "URL",
    formControl: { value: "invalid-url", disabled: false },
  },
};
