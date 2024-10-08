import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { MatchingEntitiesComponent } from "./matching-entities.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { centersUnique } from "../../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { genders } from "../../../child-dev-project/children/model/genders";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { importProvidersFrom } from "@angular/core";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";

const addressSchema: EntitySchemaField = {
  label: "Address",
  dataType: "location",
};

const entitiesA = [
  Object.assign(createEntityOfType("RecurringActivity", "A"), {
    type: defaultInteractionTypes[1],
    center: centersUnique[0],
    address: { lat: 52.4750412, lon: 13.4319106 },
  }),
  Object.assign(createEntityOfType("RecurringActivity", "B"), {
    type: defaultInteractionTypes[2],
    center: centersUnique[0],
    address: { lat: 52.4740412, lon: 13.4319106 },
  }),
  Object.assign(createEntityOfType("RecurringActivity", "ABC"), {
    type: defaultInteractionTypes[1],
    center: centersUnique[2],
    address: { lat: 52.4730412, lon: 13.4319106 },
  }),
];
const entitiesB = [
  Object.assign(TestEntity.create("sample child"), {
    gender: genders[1],
    center: centersUnique[0],
    address: { lat: 52.4720412, lon: 13.4319106 },
    otherAddress: { lat: 52.4720412, lon: 13.4419106 },
  }),
  Object.assign(TestEntity.create("other child"), {
    gender: genders[2],
    center: centersUnique[0],
    address: { lat: 52.4710412, lon: 13.4319106 },
  }),
];

export default {
  title: "Features/Matching Entities",
  component: MatchingEntitiesComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([...entitiesA, ...entitiesB]),
        ),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<MatchingEntitiesComponent> = (
  args: MatchingEntitiesComponent,
) => ({
  component: MatchingEntitiesComponent,
  props: args,
});

const columnsMapping = [
  ["name", "title"],
  ["gender", "type"],
  ["center", "center"],
  [undefined, "distance"],
];

/* TODO: fix MatchingEntities stories, breaking during initialization in storybook
export const TwoSidedMatching = Template.bind({});
TwoSidedMatching.args = {
  leftSide: {
    entityType: "Child",
  },
  rightSide: {
    entityType: RecurringActivity.ENTITY_TYPE,
  },
  columns: columnsMapping,
};

export const LeftMatch = Template.bind({});
LeftMatch.args = {
  entity: entitiesB[0],
  rightSide: {
    entityType: RecurringActivity.ENTITY_TYPE,
    filters: [{ id: "type" }],
  },
  columns: columnsMapping,
};

export const RightMatch = Template.bind({});
RightMatch.args = {
  leftSide: {
    entityType: "Child",
  },
  entity: entitiesA[0],
  columns: columnsMapping,
};*/
