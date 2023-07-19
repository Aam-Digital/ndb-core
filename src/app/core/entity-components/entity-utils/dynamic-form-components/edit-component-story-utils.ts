import { Meta } from "@storybook/angular/types-6-0";
import { FormComponent } from "../../entity-details/form/form.component";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { moduleMetadata } from "@storybook/angular";
import { EntityFormComponent } from "../../entity-form/entity-form/entity-form.component";
import {
  entityFormStorybookDefaultParameters,
  StorybookBaseModule,
} from "../../../../utils/storybook-base.module";

export function generateFormFieldStory<T>(
  editComponent,
  defaultValue
): {
  meta: Meta<FormComponent<any>>;
  entityType: EntityConstructor<Entity & { main: T; other: string }>;
} {
  @DatabaseEntity("TestEntity")
  class TestEntity extends Entity {
    @DatabaseField() main: T;
    @DatabaseField() other: string;
  }

  const testEntity = new TestEntity();
  testEntity.main = defaultValue;
  testEntity.other = "other";

  const fieldConfig: FormFieldConfig = {
    id: "main",
    edit: editComponent,
    label: "test field label",
    tooltip: "test tooltip",
  };
  const otherFieldConf: FormFieldConfig = {
    id: "other",
    edit: "EditText",
    label: "other field",
  };

  const meta: Meta = {
    title: "Core/Entities/Edit Properties/" + editComponent,
    component: FormComponent,
    decorators: [
      moduleMetadata({
        imports: [EntityFormComponent, StorybookBaseModule],
      }),
    ],
    parameters: entityFormStorybookDefaultParameters,
    args: {
      headers: ["Section A", "Section B"],
      cols: [
        [otherFieldConf, fieldConfig, fieldConfig, otherFieldConf],
        [otherFieldConf, fieldConfig, fieldConfig, otherFieldConf],
      ],
      entity: testEntity,
    },
  };

  return { meta, entityType: TestEntity };
}
