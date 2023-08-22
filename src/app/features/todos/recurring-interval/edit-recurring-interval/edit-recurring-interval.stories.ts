import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { EditRecurringIntervalComponent } from "./edit-recurring-interval.component";
import { EntityFormComponent } from "../../../../core/common-components/entity-form/entity-form/entity-form.component";
import { DatabaseEntity } from "../../../../core/entity/database-entity.decorator";
import { Entity } from "../../../../core/entity/model/entity";
import { DatabaseField } from "../../../../core/entity/database-field.decorator";
import { FormFieldConfig } from "../../../../core/common-components/entity-form/entity-form/FormConfig";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Todos/Recurring Interval",
  component: EditRecurringIntervalComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<EntityFormComponent> = (args: EntityFormComponent) => ({
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
