import { centersUnique } from "../../../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { generateFormFieldStory } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-story-utils";
import { mockEntityMapperProvider } from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { ConfigurableEnum } from "../configurable-enum";
import { ConfigurableEnumService } from "../configurable-enum.service";

const centerEnum = Object.assign(new ConfigurableEnum("center"), {
  values: centersUnique,
});
const mockEnumService = {
  getEnum: () => new ConfigurableEnum("storybook-enum", centersUnique),
  preLoadEnums: () => undefined,
  cacheEnum: () => undefined,
};

const formFieldStory = generateFormFieldStory(
  "EditConfigurableEnum",
  centerEnum.values[1],
  true,
  { additional: "center" },
  [
    { provide: ConfigurableEnumService, useValue: mockEnumService },
    ...mockEntityMapperProvider(),
  ],
);

export default {
  title: "Core/Entities/Properties/configurable-enum/EditConfigurableEnum",
  ...formFieldStory.meta,
};

const entity = new formFieldStory.entityType();
entity.main = undefined;

export const Primary = {};

export const Empty = {
  args: {
    entity: entity,
  },
};
