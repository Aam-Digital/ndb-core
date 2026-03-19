import { EventEmitter } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { Entity } from "../../entity/model/entity";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DefaultValueService } from "./default-value.service";

/**
 * Helper function to add some custom schema fields to Entity for testing.
 * Use in combination with a call to cleanUpTemporarySchemaFields() in afterEach.
 */
export function getDefaultInheritedForm(
  additionalSchemaConfig: {
    [key: string]: EntitySchemaField;
  } = {},
): EntityForm<any> {
  for (const key in additionalSchemaConfig) {
    Entity.schema.set(key, additionalSchemaConfig[key]);
  }
  Entity["_temporarySchemaFields"] = Object.keys(additionalSchemaConfig);

  const entity = new Entity();

  return {
    entity: entity,
    fieldConfigs: Array.from(entity.getSchema().entries()).map(
      ([key, fieldConfig]) => ({ id: key, ...fieldConfig }),
    ),
    inheritedParentValues: new Map(),
    watcher: new Map(),
    onFormStateChange: new EventEmitter<"saved" | "cancelled">(),
    formGroup: new FormBuilder().group<any>({
      field: new FormControl(),
      field2: new FormControl(),
      "reference-1": new FormControl(),
    }),
  };
}

/**
 * Helper function to remove custom schema fields from Entity
 * that have been created using getDefaultInheritedForm().
 */
export function cleanUpTemporarySchemaFields() {
  for (const key of Entity["_temporarySchemaFields"] ?? []) {
    Entity.schema.delete(key);
  }
  delete Entity["_temporarySchemaFields"];
}

export async function testDefaultValueCase(
  service: DefaultValueService,
  fieldSchema: EntitySchemaField,
  expected: any,
) {
  const form = getDefaultInheritedForm({
    field: fieldSchema,
  });

  await service.handleEntityForm(form, form.entity);

  expect(form.formGroup.get("field").value).toEqual(expected);

  cleanUpTemporarySchemaFields();
}
