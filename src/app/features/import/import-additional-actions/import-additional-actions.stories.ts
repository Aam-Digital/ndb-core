import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { BasicAutocompleteComponent } from "../../../core/configurable-enum/basic-autocomplete/basic-autocomplete.component";
import { DisplayEntityComponent } from "../../../core/entity-components/entity-select/display-entity/display-entity.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { EntityTypeLabelPipe } from "../../../core/entity-components/entity-type-label/entity-type-label.pipe";
import {
  IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
  IMPORT_SAMPLE_LINKABLE_DATA,
} from "../import/import-sample-raw-data";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { HelpButtonComponent } from "../../../core/common-components/help-button/help-button.component";

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
        MatListModule,
        HelpButtonComponent,
      ],
      declarations: [ImportAdditionalActionsComponent],
      providers: [
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
  importActions: IMPORT_SAMPLE_ADDITIONAL_ACTIONS,
};
