import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import {
  entityFormStorybookDefaultParameters,
  StorybookBaseModule,
} from "../../../utils/storybook-base.module";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { EntityFormComponent } from "../../../core/entity-components/entity-form/entity-form/entity-form.component";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { HttpClientModule } from "@angular/common/http";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { EditLocationComponent } from "./edit-location.component";

export default {
  title: "Features/Location/EditLocation",
  component: EntityFormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityFormComponent,
        EditLocationComponent,
        StorybookBaseModule,
        HttpClientModule,
      ],
      providers: [
        ConfirmationDialogService,
        EntitySchemaService,
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    }),
  ],
  parameters: entityFormStorybookDefaultParameters,
} as Meta;

@DatabaseEntity("LocationTest")
class LocationTest extends Entity {
  @DatabaseField({ dataType: "location", label: "Location" })
  location: any;
}

const Template: StoryFn<EntityFormComponent> = (args: EntityFormComponent) => ({
  component: EntityFormComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  columns: [["location"]],
  entity: new LocationTest(),
  editing: true,
};
