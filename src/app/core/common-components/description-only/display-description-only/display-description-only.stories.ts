import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory(
  "DisplayDescriptionOnly",
  "-",
  false,
);

export default {
  title: "Core/Entities/Properties/DisplayDescriptionOnly",
  ...formFieldStory.meta,
};

const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = {
  render: Template,
  args: {
    fieldGroups: [
      {
        fields: [
          {
            id: "description_only_text",
            viewComponent: "DisplayDescriptionOnly",
            label: $localize`"Example Markdown Text\n[Click here](https://example.com) to visit."`,
          },
        ],
      },
    ],
  },
};
