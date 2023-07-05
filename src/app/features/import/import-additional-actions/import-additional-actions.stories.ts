import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { BasicAutocompleteComponent } from "../../../core/configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { DisplayEntityComponent } from "../../../core/entity-components/entity-select/display-entity/display-entity.component";
import { DataImportService } from "../../data-import/data-import.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { School } from "../../../child-dev-project/schools/model/school";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { ReactiveFormsModule } from "@angular/forms";
import { EntityTypeLabelPipe } from "../../../core/entity-components/entity-type-label/entity-type-label.pipe";
import { IMPORT_SAMPLE_LINKABLE_DATA } from "../import/import-sample-raw-data";
import { MatButtonModule } from "@angular/material/button";

const mockImportService = {
  getLinkableEntityTypes: () => ["RecurringActivity", "School"],
};

export default {
  title: "Features/Import/2b Select Additional Actions",
  component: ImportAdditionalActionsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        StorybookBaseModule,
        MatFormFieldModule,
        BasicAutocompleteComponent,
        DisplayEntityComponent,
        MatButtonModule,
        EntityTypeLabelPipe,
      ],
      declarations: [ImportAdditionalActionsComponent],
      providers: [
        { provide: DataImportService, useValue: mockImportService },
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(IMPORT_SAMPLE_LINKABLE_DATA),
        },
        EntityTypeLabelPipe,
      ],
    }),
  ],
} as Meta;

const Template: Story<ImportAdditionalActionsComponent> = (
  args: ImportAdditionalActionsComponent
) => ({
  props: args,
});

export const Basic = Template.bind({});
Basic.args = {
  entityType: "Child",
};

export const Disabled = Template.bind({});
Disabled.args = {};

export const WithExistingActions = Template.bind({});
WithExistingActions.args = {
  entityType: "Child",
  importActions: [
    {
      type: "School",
      id: IMPORT_SAMPLE_LINKABLE_DATA.find((e) => e.getType() === "School"),
    },
    {
      type: "RecurringActivity",
      id: IMPORT_SAMPLE_LINKABLE_DATA.find(
        (e) => e.getType() === "RecurringActivity"
      ),
    },
  ],
};
