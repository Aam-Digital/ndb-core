import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { EditRecurringIntervalComponent } from "./edit-recurring-interval.component";
import { TasksModule } from "../../tasks.module";
import { EntityFormComponent } from "../../../../core/entity-components/entity-form/entity-form/entity-form.component";
import { EntityFormModule } from "../../../../core/entity-components/entity-form/entity-form.module";
import { EntityUtilsModule } from "../../../../core/entity-components/entity-utils/entity-utils.module";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { DatabaseEntity } from "../../../../core/entity/database-entity.decorator";
import { Entity } from "../../../../core/entity/model/entity";
import { DatabaseField } from "../../../../core/entity/database-field.decorator";
import { FormFieldConfig } from "../../../../core/entity-components/entity-form/entity-form/FormConfig";
import { mockEntityMapper } from "../../../../core/entity/mock-entity-mapper-service";

export default {
  title: "Features/Tasks/Recurring Interval",
  component: EditRecurringIntervalComponent,
  decorators: [
    moduleMetadata({
      imports: [
        TasksModule,
        EntityFormModule,
        EntityUtilsModule,
        StorybookBaseModule,
      ],
      providers: [
        EntitySchemaService,
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(),
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<EntityFormComponent> = (args: EntityFormComponent) => ({
  component: EntityFormComponent,
  props: args,
});

@DatabaseEntity("RecurringIntervalTestEntity")
class RecurringIntervalTestEntity extends Entity {
  @DatabaseField() interval: string;
  @DatabaseField() name: string;
}
const fieldConfig: FormFieldConfig = {
  id: "interval",
  edit: "EditRecurringInterval",
  label: "test field label",
  tooltip: "test tooltip",
  additional: [
    { label: "every week", interval: { value: 1, unit: "week" } },
    { label: "every two weeks", interval: { value: 2, unit: "week" } },
  ],
};
const otherFieldConf: FormFieldConfig = {
  id: "name",
  edit: "EditText",
  label: "other field",
};

const testEntity = new RecurringIntervalTestEntity();
testEntity.name = "test";

export const Primary = Template.bind({});
Primary.args = {
  columns: [[otherFieldConf, fieldConfig, otherFieldConf]],
  entity: testEntity,
  editing: true,
};
