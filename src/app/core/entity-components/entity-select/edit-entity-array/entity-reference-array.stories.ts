import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { EntityFormComponent } from "../../entity-form/entity-form/entity-form.component";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import {
  entityFormStorybookDefaultParameters,
  StorybookBaseModule,
} from "../../../../utils/storybook-base.module";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { mockEntityMapper } from "../../../entity/mock-entity-mapper-service";
import { User } from "../../../user/user";
import { FormComponent } from "../../entity-details/form/form.component";

const testUser = new User("1");
testUser.name = "test entity";
const user2 = new User("2");
user2.name = "other entity";

export default {
  title: "Core/Entities/Edit Properties/Entity Reference Array",
  component: FormComponent,
  decorators: [
    moduleMetadata({
      imports: [EntityFormComponent, StorybookBaseModule],
      providers: [
        EntitySchemaService,
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([testUser, user2]),
        },
      ],
    }),
  ],
  parameters: entityFormStorybookDefaultParameters,
} as Meta;

const Template: Story<FormComponent<any>> = (args: FormComponent<any>) => ({
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
  @DatabaseField() x: number;
}

const testEntity = new TestEntity();
testEntity.relatedEntities = [testUser.getId()];

export const Primary = Template.bind({});
Primary.args = {
  cols: [[otherField, fieldConfig, otherField, otherField]],
  entity: testEntity,
};
