import { ExportColumnMapping } from "../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";

export interface ExportColumnResolver {
  sourceFieldId: string;
  schemaField: EntitySchemaField;
  column: ExportColumnMapping;
}

/**
 * Build export column resolvers for all fields in a schema.
 *
 * Iterates the schema, looks up each field's datatype, and collects
 * the columns the datatype contributes via `getExportColumns`.
 *
 * Internal fields are excluded, except the record's internal id `_id`, which users
 * need to relate exported records to each other. It can be selected for an
 * export but is left out of an export that selects no columns,
 * see `DownloadService.prepareExportData`.
 *
 * @param useFieldIdAsFallbackLabel When true, fields without an explicit label
 *   use the field id as label (useful for embedded schemas like attendance items).
 */
export function buildExportColumnResolvers(
  schema: Map<string, EntitySchemaField>,
  entitySchemaService: EntitySchemaService,
  useFieldIdAsFallbackLabel = false,
): ExportColumnResolver[] {
  const resolvers: ExportColumnResolver[] = [];

  for (const [fieldId, field] of schema.entries()) {
    if (field.isInternalField && fieldId !== "_id") continue;

    const schemaField: EntitySchemaField = {
      ...field,
      id: field.id ?? fieldId,
      label: field.label || (useFieldIdAsFallbackLabel ? fieldId : undefined),
    };

    const datatype = entitySchemaService.getDatatypeOrDefault(
      schemaField.dataType,
    );

    for (const column of datatype.getExportColumns(schemaField)) {
      resolvers.push({ sourceFieldId: fieldId, schemaField, column });
    }
  }

  return resolvers;
}
