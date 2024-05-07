import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
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
  title: "Core/Entities/Properties/entity/EditEntity",
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
  id: "relatedEntity",
  label: "related entity",
  description: "test tooltip",
};
const fieldMultiConfig: FormFieldConfig = {
  id: "relatedEntities",
  label: "related entities (multi select)",
  description: "test tooltip",
};
const otherField: FormFieldConfig = {
  id: "x",
  label: "other label",
};

@DatabaseEntity("TestEntityReferenceArrayEntity")
class TestEntity extends Entity {
  @DatabaseField({
    dataType: "entity",
    isArray: true,
    additional: User.ENTITY_TYPE,
  })
  relatedEntities: string[];

  @DatabaseField({
    dataType: "entity",
    additional: User.ENTITY_TYPE,
  })
  relatedEntity: string;

  @DatabaseField() x: number;
}

const testEntity = new TestEntity();
testEntity.relatedEntities = [testUser.getId()];

export const Primary = Template.bind({});
Primary.args = {
  fieldGroups: [
    { fields: [otherField, fieldConfig, fieldMultiConfig, otherField] },
  ],
  entity: testEntity,
};
