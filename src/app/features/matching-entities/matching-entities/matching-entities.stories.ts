import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { MatchingEntitiesComponent } from "./matching-entities.component";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { DownloadService } from "../../../core/export/download-service/download.service";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { ConfigurableEnumDatatype } from "../../../core/configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import { ConfigService } from "../../../core/config/config.service";
import { centersUnique } from "../../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { genders } from "../../../child-dev-project/children/model/genders";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";

RecurringActivity.schema.set("center", {
  dataType: "configurable-enum",
  innerDataType: "center",
});
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
    moduleMetadata({
      imports: [MatchingEntitiesComponent, StorybookBaseModule],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([...entitiesA, ...entitiesB]),
        },
        { provide: DownloadService, useValue: null },
        {
          provide: EntitySchemaService,
          useFactory: (configService: ConfigService) => {
            const schemaService = new EntitySchemaService();
            schemaService.registerSchemaDatatype(
              new ConfigurableEnumDatatype(configService)
            );
            return schemaService;
          },
        },
        FormDialogService,
      ],
    }),
  ],
} as Meta;

const Template: Story<MatchingEntitiesComponent> = (
  args: MatchingEntitiesComponent
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

export const TwoSidedMatching = Template.bind({});
TwoSidedMatching.args = {
  leftSide: { entityType: Child.ENTITY_TYPE },
  rightSide: { entityType: RecurringActivity.ENTITY_TYPE },
  columns: columnsMapping,
  showMap: [["address", "otherAddress"], "address"],
};

export const LeftMatch = Template.bind({});
LeftMatch.args = {
  entity: entitiesB[0],
  rightSide: {
    entityType: RecurringActivity.ENTITY_TYPE,
    filters: [{ id: "type" }],
  },
  columns: columnsMapping,
  showMap: ["address", "address"],
};

export const RightMatch = Template.bind({});
RightMatch.args = {
  leftSide: { entityType: Child.ENTITY_TYPE },
  entity: entitiesA[0],
  columns: columnsMapping,
  showMap: ["address", "address"],
};
