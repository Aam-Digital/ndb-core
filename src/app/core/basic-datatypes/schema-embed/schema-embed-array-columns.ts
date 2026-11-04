import {
  ColumnConfig,
  FormFieldConfig,
} from "#src/app/core/common-components/entity-form/FormConfig";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { getSchemaEmbedDatatype } from "#src/app/core/entity/schema/embedded-schema-field.util";

/**
 * Resolve the inner fields of a `schema-embed-array` field as table columns
 * through the field's datatype (see `SchemaEmbedDatatype.getColumns`).
 *
 * @param fieldConfig the schema-embed-array field (holding the inner fields in `additional`)
 * @param entitySchemaService to look up the field's datatype
 * @param columns optional selection (and overrides) of the inner fields, in display order
 * @returns the columns, or none if the field is not of a schema-embed datatype
 */
export function getSchemaEmbedArrayColumns(
  fieldConfig: EntitySchemaField | undefined,
  entitySchemaService: EntitySchemaService,
  columns?: ColumnConfig[],
): FormFieldConfig[] {
  return (
    getSchemaEmbedDatatype(entitySchemaService, fieldConfig)?.getColumns(
      fieldConfig,
      columns,
    ) ?? []
  );
}
