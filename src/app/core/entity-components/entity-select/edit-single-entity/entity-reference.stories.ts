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
import { Child } from "../../../../child-dev-project/children/model/child";
import { FormComponent } from "../../entity-details/form/form.component";

const testUser = new User("1");
testUser.name = "test entity";
const user2 = new User("2");
user2.name = "other entity";
const child1 = new Child("1");
child1.name = "test child";

export default {
  title: "Core/Entities/Edit Properties/Entity Reference",
  component: FormComponent,
  decorators: [
    moduleMetadata({
      imports: [EntityFormComponent, StorybookBaseModule],
      providers: [
        EntitySchemaService,
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([testUser, user2, child1]),
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
  id: "relatedEntity",
  view: "DisplayEntity",
  edit: "EditSingleEntity",
  label: "test related entity label",
  tooltip: "test tooltip",
};
const otherField: FormFieldConfig = {
  id: "x",
  view: "DisplayNumber",
  edit: "EditNumber",
  label: "other label",
};

@DatabaseEntity("TestEntityReferenceEntity")
class TestEntity extends Entity {
  @DatabaseField({
    dataType: "entity-reference",
    additional: User.ENTITY_TYPE,
  })
  relatedEntity: string;

  @DatabaseField() x;

  @DatabaseField({
    dataType: "entity-reference",
    additional: Child.ENTITY_TYPE,
  })
  relatedChild: string = "1";
}

const testEntity = new TestEntity();
testEntity.relatedEntity = testUser.getId();

export const Primary = Template.bind({});
Primary.args = {
  cols: [
    [
      otherField,
      fieldConfig,
      Object.assign({}, fieldConfig, { id: "relatedChild" }),
      otherField,
    ],
  ],
  entity: testEntity,
};
