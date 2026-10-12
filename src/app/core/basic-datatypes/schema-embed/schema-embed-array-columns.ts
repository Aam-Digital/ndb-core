import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { SchemaEmbedDatatype } from "./schema-embed.datatype";

/**
 * Resolve the inner fields of a `schema-embed-array` field as table columns,
 * each with its resolved `viewComponent` for rendering cells.
 *
 * @param fieldConfig the schema-embed-array field (holding the inner fields in `additional`)
 * @param entitySchemaService to look up the field's datatype and the inner fields' view components
 */
export function getSchemaEmbedArrayColumns(
  fieldConfig: EntitySchemaField | undefined,
  entitySchemaService: EntitySchemaService,
): FormFieldConfig[] {
  if (!fieldConfig?.dataType) {
    return [];
  }
  const dataType = entitySchemaService.getDatatypeOrDefault(
    fieldConfig.dataType,
  ) as SchemaEmbedDatatype;
  return [...dataType.getEffectiveSchema(fieldConfig).entries()].map(
    ([id, column]) => ({
      ...column,
      id,
      viewComponent: entitySchemaService.getComponent(column, "view"),
    }),
  );
}
