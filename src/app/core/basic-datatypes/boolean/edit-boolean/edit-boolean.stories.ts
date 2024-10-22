import { Meta } from "@storybook/angular";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";

const formFieldStory = generateFormFieldStory("EditBoolean", true);

export default {
  title: "Core/Entities/Properties/boolean/EditBoolean",
  ...formFieldStory.meta,
} as Meta;

const entity = new formFieldStory.entityType();
entity.main = false;

export const Checked = {};

export const Unchecked = {
  args: {
    entity: entity,
  },
};
