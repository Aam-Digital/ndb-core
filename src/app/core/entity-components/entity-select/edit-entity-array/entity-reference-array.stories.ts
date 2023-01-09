import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { EntityFormComponent } from "../../entity-form/entity-form/entity-form.component";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import {
  entityFormStorybookDefaulParameters,
  StorybookBaseModule,
} from "../../../../utils/storybook-base.module";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { mockEntityMapper } from "../../../entity/mock-entity-mapper-service";
import { User } from "../../../user/user";

const testUser = new User("1");
testUser.name = "test entity";
const user2 = new User("2");
user2.name = "other entity";

export default {
  title: "Core/EntityComponents/Entity Property Fields/Entity Reference Array",
  component: EntityFormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntityFormComponent,
        StorybookBaseModule,
      ],
      providers: [
        EntitySchemaService,
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([testUser, user2]),
        },
      ],
    }),
  ],
  parameters: entityFormStorybookDefaulParameters,
} as Meta;

const Template: Story<EntityFormComponent> = (args: EntityFormComponent) => ({
  component: EntityFormComponent,
  props: args,
});

const fieldConfig: FormFieldConfig = {
  id: "relatedEntities",
  view: "DisplayEntityArray",
  edit: "EditEntityArray",
  label: "test related entities label",
  tooltip: "test tooltip",
};
const otherField: FormFieldConfig = {
  id: "x",
  view: "DisplayNumber",
  edit: "EditNumber",
  label: "other label",
};

@DatabaseEntity("TestEntityReferenceArrayEntity")
class TestEntity extends Entity {
  @DatabaseField({
    dataType: "entity-reference-array",
    additional: User.ENTITY_TYPE,
  })
  relatedEntities: string[];
  @DatabaseField() x: number = 1;
}

const testEntity = new TestEntity();
testEntity.relatedEntities = [testUser.getId()];

export const Primary = Template.bind({});
Primary.args = {
  columns: [[otherField, fieldConfig, otherField, otherField]],
  entity: testEntity,
};

export const Edit = Template.bind({});
Edit.args = {
  columns: [[otherField, fieldConfig, otherField, otherField]],
  entity: testEntity,
  editing: true,
};
