import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { MatchingEntitiesComponent } from "./matching-entities.component";
import { MatchingEntitiesModule } from "../matching-entities.module";
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
  }),
  Object.assign(RecurringActivity.create("B"), {
    type: defaultInteractionTypes[2],
    center: centersUnique[0],
  }),
  Object.assign(RecurringActivity.create("ABC"), {
    type: defaultInteractionTypes[1],
    center: centersUnique[2],
  }),
];
const entitiesB = [
  Object.assign(Child.create("sample child"), {
    gender: genders[1],
    center: centersUnique[0],
  }),
  Object.assign(Child.create("other child"), {
    gender: genders[2],
    center: centersUnique[0],
  }),
];

export default {
  title: "Features/Matching Entities",
  component: MatchingEntitiesComponent,
  decorators: [
    moduleMetadata({
      imports: [MatchingEntitiesModule, StorybookBaseModule],
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
];

export const TwoSidedMatching = Template.bind({});
TwoSidedMatching.args = {
  leftEntityType: Child.ENTITY_TYPE,
  rightEntityType: RecurringActivity.ENTITY_TYPE,
  columns: columnsMapping,
  showMap: true,
};

export const LeftMatch = Template.bind({});
LeftMatch.args = {
  leftEntitySelected: entitiesB[0],
  rightEntityType: RecurringActivity.ENTITY_TYPE,
  rightFilters: [{ id: "type" }],
  columns: columnsMapping,
  showMap: true,
};

export const RightMatch = Template.bind({});
RightMatch.args = {
  leftEntityType: Child.ENTITY_TYPE,
  rightEntitySelected: entitiesA[0],
  columns: columnsMapping,
  showMap: true,
};
