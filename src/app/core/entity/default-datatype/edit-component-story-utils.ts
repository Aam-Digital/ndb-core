import { FormComponent } from "../../entity-details/form/form.component";
import { Entity, EntityConstructor } from "../model/entity";
import { DatabaseEntity } from "../database-entity.decorator";
import { DatabaseField } from "../database-field.decorator";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";
import { applicationConfig, Meta } from "@storybook/angular";
import {
  entityFormStorybookDefaultParameters,
  StorybookBaseModule,
} from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

/**
 *
 * @param editComponent
 * @param defaultValue
 * @param withTooltip set to `false` to disable tooltip (?) button
 * @param additionalSchema an object that is applied to the schema field and allows to overwrite or add schema properties
 * @param additionalProviders Angular service providers that should be initialized in addition to defaults
 */
export function generateFormFieldStory<T>(
  editComponent,
  defaultValue,
  withTooltip = true,
  additionalSchema = {},
  additionalProviders = [],
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
    description: withTooltip ? "test tooltip" : undefined,
    ...additionalSchema,
  };
  const otherFieldConf: FormFieldConfig = {
    id: "other",
    edit: "EditText",
    label: "other field",
  };

  const meta: Meta = {
    component: FormComponent,
    decorators: [
      applicationConfig({
        providers: [
          importProvidersFrom(StorybookBaseModule),
          ...additionalProviders,
        ],
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
