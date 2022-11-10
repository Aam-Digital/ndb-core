import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { EntityUtilsModule } from "../../entity-utils.module";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { EntityFormComponent } from "../../../entity-form/entity-form/entity-form.component";
import { EntityFormModule } from "../../../entity-form/entity-form.module";
import { FormFieldConfig } from "../../../entity-form/entity-form/FormConfig";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { AlertsModule } from "../../../../alerts/alerts.module";
import { StorybookBaseModule } from "../../../../../utils/storybook-base.module";
import { DatabaseEntity } from "../../../../entity/database-entity.decorator";
import { Entity } from "../../../../entity/model/entity";
import { DatabaseField } from "../../../../entity/database-field.decorator";
import { mockEntityMapper } from "../../../../entity/mock-entity-mapper-service";
import { User } from "../../../../user/user";
import { Child } from "../../../../../child-dev-project/children/model/child";

const testUser = new User("1");
testUser.name = "test entity";
const user2 = new User("2");
user2.name = "other entity";
const child1 = new Child("1");
child1.name = "test child";

export default {
  title: "Core/EntityComponents/Entity Property Fields/Entity Reference",
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
          useValue: mockEntityMapper([testUser, user2, child1]),
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

  @DatabaseField() x = 1;

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
  columns: [[fieldConfig]],
  entity: testEntity,
};

export const Edit = Template.bind({});
Edit.args = {
  columns: [
    [
      otherField,
      fieldConfig,
      Object.assign({}, fieldConfig, { id: "relatedChild" }),
      otherField,
    ],
  ],
  entity: testEntity,
  editing: true,
};
