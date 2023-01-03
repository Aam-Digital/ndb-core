import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { EntityFormComponent } from "../../../entity-form/entity-form/entity-form.component";
import { FormFieldConfig } from "../../../entity-form/entity-form/FormConfig";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { Entity } from "../../../../entity/model/entity";
import { DatabaseField } from "../../../../entity/database-field.decorator";
import { DatabaseEntity } from "../../../../entity/database-entity.decorator";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { EditNumberComponent } from "./edit-number.component";

export default {
  title: "Core/EntityComponents/Entity Property Fields/Number",
  component: EntityFormComponent,
  decorators: [
    moduleMetadata({
      imports: [EntityFormComponent, EditNumberComponent, StorybookBaseModule],
      providers: [
        EntitySchemaService,
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
      ],
    }),
  ],
  parameters: {
    controls: {
      exclude: ["_columns"],
    },
  },
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
  view: "DisplayNumber",
  edit: "EditNumber",
  label: "test field label",
  tooltip: "test tooltip",
};

const testEntity = new TestEntity();
testEntity.test = 5;

export const Primary = Template.bind({});
Primary.args = {
  columns: [[fieldConfig]],
  entity: testEntity,
};
