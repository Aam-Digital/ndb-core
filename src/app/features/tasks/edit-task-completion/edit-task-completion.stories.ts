import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { TasksModule } from "../tasks.module";
import { EntityFormModule } from "../../../core/entity-components/entity-form/entity-form.module";
import { EntityUtilsModule } from "../../../core/entity-components/entity-utils/entity-utils.module";
import {
  appStorybookDefaulParameters,
  StorybookBaseModule,
} from "../../../utils/storybook-base.module";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { EntityFormComponent } from "../../../core/entity-components/entity-form/entity-form/entity-form.component";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

export default {
  title: "Features/Tasks/TaskCompletion",
  component: EntityFormComponent,
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
  parameters: appStorybookDefaulParameters,
} as Meta;

const Template: Story<EntityFormComponent> = (args: EntityFormComponent) => ({
  component: EntityFormComponent,
  props: args,
});

@DatabaseEntity("TaskCompletionTestEntity")
class TaskCompletionTestEntity extends Entity {
  @DatabaseField() completed: boolean;
  @DatabaseField() name: string;
}

const fieldConfig: FormFieldConfig = {
  id: "completed",
  edit: "EditTaskCompletion",
  label: "test field label",
  tooltip: "test tooltip",
};
const otherFieldConf: FormFieldConfig = {
  id: "name",
  edit: "EditText",
  label: "other field",
};

const testEntity = new TaskCompletionTestEntity();
testEntity.name = "test";

export const Incomplete = Template.bind({});
Incomplete.args = {
  columns: [[otherFieldConf, fieldConfig, otherFieldConf]],
  entity: testEntity,
  editing: true,
};

const testEntity2 = new TaskCompletionTestEntity();
testEntity2.name = "test";
testEntity2.completed = true;

export const Complete = Template.bind({});
Complete.args = {
  columns: [[otherFieldConf, fieldConfig, otherFieldConf]],
  entity: testEntity2,
  editing: true,
};
