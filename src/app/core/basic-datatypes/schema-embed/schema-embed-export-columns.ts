import {
  ExportColumnMapping,
  ExportContext,
} from "#src/app/core/entity/default-datatype/default.datatype";
import { EntitySchema } from "#src/app/core/entity/schema/entity-schema";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import {
  buildExportColumnResolvers,
  ExportColumnResolver,
} from "#src/app/core/export/export-column-resolvers";
import { toExportValue } from "#src/app/core/export/export-value";
import { EXPORT_BATCH_SIZE } from "#src/app/core/export/readable-entity-name";
import { mapInBatches } from "#src/app/utils/utils";
import { isEmptyValue } from "#src/app/utils/is-empty-value";

/** Separator between the values of one entry, e.g. "Passport, 12345". */
const VALUE_SEPARATOR = ", ";
/** Separator between the parts of an inner field exported in several columns, e.g. "2020-01-01 - 2020-12-31". */
const COLUMN_PART_SEPARATOR = " - ";
/** Separator between the entries of an array field, e.g. "Passport, 12345; ID Card, 678". */
const ENTRY_SEPARATOR = "; ";

/** An inner field of an embedded object, formatted for exports through its own datatype. */
interface InnerExportField {
  id: string;
  label: string;
  /** The readable export value of this inner field in the given embedded object ("" if empty). */
  format: (
    embeddedObject: Record<string, any> | undefined,
    context?: ExportContext,
  ) => Promise<string>;
}

/**
 * Export columns of a `schema-embed` field, built from its inner fields,
 * each formatted like a top-level field of the same datatype (e.g. names of referenced entities, enum labels).
 *
 * - single embedded object: one column per inner field
 * - array of embedded objects: one column with all entries (preselected), one column per inner field
 *   with the values of all entries (offered, but not preselected) and one with the number of entries (preselected)
 *
 * @param schemaField the field using a schema-embed datatype
 * @param innerSchema the inner fields of the embedded objects
 * @param holdsArray whether the field holds an array of embedded objects
 * @param entitySchemaService to look up the inner fields' datatypes
 */
export function getSchemaEmbedExportColumns(
  schemaField: EntitySchemaField,
  innerSchema: EntitySchema,
  holdsArray: boolean,
  entitySchemaService: EntitySchemaService,
): ExportColumnMapping[] {
  if (!schemaField.label) {
    return [];
  }
  const innerFields = getInnerExportFields(innerSchema, entitySchemaService);

  if (!holdsArray) {
    return innerFields.map((innerField) => ({
      keySuffix: `_${innerField.id}`,
      label: `${schemaField.label} (${innerField.label})`,
      resolveValue: (value: Record<string, any>, _field, context) =>
        innerField.format(value, context),
    }));
  }

  return [
    {
      keySuffix: "",
      label: schemaField.label,
      resolveValue: async (value: unknown, _field, context) => {
        const entries = await mapEntries(value, (entry) =>
          formatEntry(entry, innerFields, context),
        );
        return entries.join(ENTRY_SEPARATOR);
      },
    },
    ...innerFields.map((innerField) => ({
      keySuffix: `_${innerField.id}`,
      label: `${schemaField.label} (${innerField.label})`,
      preselect: false,
      resolveValue: async (value: unknown, _field, context) => {
        // keep empty values, so that the values of one entry are at the same position in every column
        const values = await mapEntries(value, (entry) =>
          innerField.format(entry, context),
        );
        return values.join(ENTRY_SEPARATOR);
      },
    })),
    {
      keySuffix: "_count",
      label:
        schemaField.label +
        $localize`:export column suffix for the number of entries of an embedded table: (number of entries)`,
      resolveValue: (value: unknown) => asEntries(value).length,
    },
  ];
}

/**
 * The inner fields with a formatter each, using the readable export column of their datatype
 * (e.g. the name rather than the id of a referenced entity).
 */
function getInnerExportFields(
  innerSchema: EntitySchema,
  entitySchemaService: EntitySchemaService,
): InnerExportField[] {
  const resolversByField = new Map<string, ExportColumnResolver[]>();
  for (const resolver of buildExportColumnResolvers(
    innerSchema,
    entitySchemaService,
    true,
  )) {
    const fieldResolvers = resolversByField.get(resolver.sourceFieldId) ?? [];
    fieldResolvers.push(resolver);
    resolversByField.set(resolver.sourceFieldId, fieldResolvers);
  }

  return [...resolversByField.entries()].map(([id, resolvers]) => {
    const { schemaField } = resolvers[0];
    const mainColumn =
      resolvers.find((r) => r.column.keySuffix === "_readable") ??
      resolvers.find((r) => r.column.keySuffix === "");
    // datatypes without a main column (e.g. date ranges: start and end) are combined from all their columns
    const columns = mainColumn
      ? [mainColumn.column]
      : resolvers.map((r) => r.column);

    return {
      id,
      label: schemaField.label,
      format: async (embeddedObject, context) => {
        const values = await Promise.all(
          columns.map(async (column) =>
            toExportValue(
              await column.resolveValue(
                embeddedObject?.[id],
                schemaField,
                context,
              ),
            ),
          ),
        );
        return values
          .filter((value) => !isEmptyValue(value))
          .join(COLUMN_PART_SEPARATOR);
      },
    };
  });
}

/** The values of all inner fields of one entry, leaving out empty ones. */
async function formatEntry(
  entry: Record<string, any>,
  innerFields: InnerExportField[],
  context?: ExportContext,
): Promise<string> {
  const values = await Promise.all(
    innerFields.map((innerField) => innerField.format(entry, context)),
  );
  return values.filter((value) => value !== "").join(VALUE_SEPARATOR);
}

function asEntries(value: unknown): Record<string, any>[] {
  return Array.isArray(value) ? value : [];
}

/** Format all entries, in batches as they may load referenced entities. */
function mapEntries(
  value: unknown,
  format: (entry: Record<string, any>) => Promise<string>,
): Promise<string[]> {
  return mapInBatches(asEntries(value), EXPORT_BATCH_SIZE, format);
}
