import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { MatchingEntitiesComponent } from "./matching-entities.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { centersUnique } from "../../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { genders } from "../../../child-dev-project/children/model/genders";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { importProvidersFrom } from "@angular/core";

const addressSchema: EntitySchemaField = {
  id: "address",
  label: "Address",
  dataType: "location",
};
RecurringActivity.schema.set("center", Child.schema.get("center"));
RecurringActivity.schema.set("address", addressSchema);
Child.schema.set("address", addressSchema);
Child.schema.set("otherAddress", addressSchema);

const entitiesA = [
  Object.assign(RecurringActivity.create("A"), {
    type: defaultInteractionTypes[1],
    center: centersUnique[0],
    address: { lat: 52.4750412, lon: 13.4319106 },
  }),
  Object.assign(RecurringActivity.create("B"), {
    type: defaultInteractionTypes[2],
    center: centersUnique[0],
    address: { lat: 52.4740412, lon: 13.4319106 },
  }),
  Object.assign(RecurringActivity.create("ABC"), {
    type: defaultInteractionTypes[1],
    center: centersUnique[2],
    address: { lat: 52.4730412, lon: 13.4319106 },
  }),
];
const entitiesB = [
  Object.assign(Child.create("sample child"), {
    gender: genders[1],
    center: centersUnique[0],
    address: { lat: 52.4720412, lon: 13.4319106 },
    otherAddress: { lat: 52.4720412, lon: 13.4419106 },
  }),
  Object.assign(Child.create("other child"), {
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
    entityType: Child.ENTITY_TYPE,
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
    entityType: Child.ENTITY_TYPE,
  },
  entity: entitiesA[0],
  columns: columnsMapping,
};*/
