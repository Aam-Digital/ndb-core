import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
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
import {
  appStorybookDefaulParameters,
  StorybookBaseModule,
} from "../../../../../utils/storybook-base.module";

export default {
  title: "Core/EntityComponents/Entity Property Fields/Checkbox",
  component: EntityFormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityFormModule,
        EntityUtilsModule,
        AlertsModule,
        StorybookBaseModule,
      ],
      providers: [
        EntitySchemaService,
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
      ],
    }),
  ],
  parameters: appStorybookDefaulParameters,
} as Meta;

const Template: Story<EntityFormComponent> = (args: EntityFormComponent) => ({
  component: EntityFormComponent,
  props: args,
});

@DatabaseEntity("BooleanTestEntity")
class BooleanTestEntity extends Entity {
  @DatabaseField() check: boolean;
  @DatabaseField() name: string;
}
const fieldConfig: FormFieldConfig = {
  id: "check",
  edit: "EditBoolean",
  label: "test field label",
  tooltip: "test tooltip",
};
const otherFieldConf: FormFieldConfig = {
  id: "name",
  edit: "EditText",
  label: "other field",
};

const testEntity = new BooleanTestEntity();
testEntity.check = true;
testEntity.name = "test";

export const Primary = Template.bind({});
Primary.args = {
  columns: [[otherFieldConf, fieldConfig, fieldConfig, otherFieldConf]],
  entity: testEntity,
};
