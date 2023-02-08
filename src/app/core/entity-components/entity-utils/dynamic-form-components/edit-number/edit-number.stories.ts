import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { FormFieldConfig } from "../../../entity-form/entity-form/FormConfig";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { Entity } from "../../../../entity/model/entity";
import { DatabaseField } from "../../../../entity/database-field.decorator";
import { DatabaseEntity } from "../../../../entity/database-entity.decorator";
import { EditNumberComponent } from "./edit-number.component";
import {
  entityFormStorybookDefaultParameters,
  StorybookBaseModule,
} from "../../../../../utils/storybook-base.module";
import { AppModule } from "../../../../../app.module";
import { mockEntityMapper } from "../../../../entity/mock-entity-mapper-service";
import { FormComponent } from "../../../entity-details/form/form.component";

export default {
  title: "Core/EntityComponents/Entity Property Fields/Number",
  component: FormComponent,
  decorators: [
    moduleMetadata({
      imports: [
        FormComponent,
        EditNumberComponent,
        AppModule,
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
  parameters: entityFormStorybookDefaultParameters,
} as Meta;

const Template: Story<FormComponent<any>> = (args: FormComponent<any>) => ({
  component: FormComponent,
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
