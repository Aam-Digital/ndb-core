import { StoryFn } from "@storybook/angular";
import { centersUnique } from "../../../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { ConfigurableEnum } from "../configurable-enum";
import { generateFormFieldStory } from "../../../entity/default-datatype/edit-component-story-utils";
import { ConfigurableEnumService } from "../configurable-enum.service";

const centerEnum = Object.assign(new ConfigurableEnum("center"), {
  values: centersUnique,
});
const mockEnumService = {
  getEnum: () => ({ values: centersUnique }),
  preLoadEnums: () => undefined,
};

const formFieldStory = generateFormFieldStory(
  "EditConfigurableEnum",
  centerEnum.values[1],
  true,
  { additional: "center" },
  [{ provide: ConfigurableEnumService, useValue: mockEnumService }],
);

export default {
  title: "Core/Entities/Edit Properties/EditConfigurableEnum",
  ...formFieldStory.meta,
};
const Template: StoryFn = (args) => ({
  props: args,
});

export const Primary = Template.bind({});

export const Empty = Template.bind({});
const entity = new formFieldStory.entityType();
entity.main = undefined;
Empty.args = {
  entity: entity,
};
