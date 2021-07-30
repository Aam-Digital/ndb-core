import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntityUtilsModule } from "../../entity-utils.module";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { EntityFormComponent } from "../../../entity-form/entity-form/entity-form.component";
import { EntityFormModule } from "../../../entity-form/entity-form.module";
import { FormFieldConfig } from "../../../entity-form/entity-form/FormConfig";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { AlertsModule } from "../../../../alerts/alerts.module";
import { Entity } from "../../../../entity/model/entity";
import { DatabaseField } from "../../../../entity/database-field.decorator";
import { DatabaseEntity } from "../../../../entity/database-entity.decorator";
import { EntityPermissionsService } from "../../../../permissions/entity-permissions.service";

export default {
  title: "Core/Entity Property Fields/Percentage",
  component: EntityFormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityFormModule,
        EntityUtilsModule,
        AlertsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        EntitySchemaService,
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
        {
          provide: EntityPermissionsService,
          useValue: { userIsPermitted: () => true },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<EntityFormComponent> = (args: EntityFormComponent) => ({
  component: EntityFormComponent,
  props: args,
});

@DatabaseEntity("TestEntity")
class TestEntity extends Entity {
  @DatabaseField() test: number;
}
const fieldConfig: FormFieldConfig = {
  id: "test",
  view: "DisplayPercentage",
  edit: "EditPercentage",
  label: "test field label",
  tooltip: "test tooltip",
};
const testEntity = new TestEntity();
testEntity.test = 99;

export const Primary = Template.bind({});
Primary.args = {
  columns: [[fieldConfig]],
  entity: testEntity,
};
