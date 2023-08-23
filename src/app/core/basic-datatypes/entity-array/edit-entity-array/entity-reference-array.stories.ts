import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { FormFieldConfig } from "../../../common-components/entity-form/entity-form/FormConfig";
import {
  entityFormStorybookDefaultParameters,
  StorybookBaseModule,
} from "../../../../utils/storybook-base.module";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { User } from "../../../user/user";
import { FormComponent } from "../../../entity-details/form/form.component";
import { importProvidersFrom } from "@angular/core";

const testUser = new User("1");
testUser.name = "test entity";
const user2 = new User("2");
user2.name = "other entity";

export default {
  title: "Core/Entities/Edit Properties/Entity Reference Array",
  component: FormComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData([testUser, user2])),
      ],
    }),
  ],
  parameters: entityFormStorybookDefaultParameters,
} as Meta;

const Template: StoryFn<FormComponent<any>> = (args: FormComponent<any>) => ({
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
