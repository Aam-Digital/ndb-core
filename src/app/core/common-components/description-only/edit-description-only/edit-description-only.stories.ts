import { StoryFn } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory(
  "EditDescriptionOnly",
  "-",
  false,
);

export default {
  title: "Core/Entities/Properties/EditDescriptionOnly",
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
            editComponent: "EditDescriptionOnly",
            label: $localize`"Example Markdown Text\n[Click here](https://example.com) to visit."`,
          },
        ],
      },
    ],
  },
};
