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
    formFieldConfig: {
      label: "Description",
      value: `This is **bold text** and [a link](https://example.com).
      
- List item 1
- List item 2
      
\`Inline code\` and a code block:

\`\`\`
console.log("Hello, Markdown!");
\`\`\`
`,
    },
  },
};
