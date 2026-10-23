import { EntityConstructor } from "../model/entity";
import { EntitySchema } from "./entity-schema";
import { EntitySchemaField } from "./entity-schema-field";
import { EntitySchemaService } from "./entity-schema.service";
import { SchemaEmbedDatatype } from "../../basic-datatypes/schema-embed/schema-embed.datatype";
import { getInnerEntityReferenceFields } from "./entity-reference-fields";

/**
 * Separator used to build an id referencing a property nested inside an embedded field,
 * e.g. "childrenAttendance.participant" references the "participant" property
 * of the entries of the embedded field "childrenAttendance".
 */
export const EMBEDDED_FIELD_ID_SEPARATOR = ".";

/**
 * Resolved reference to a property nested inside an embedded field
 * (e.g. `childrenAttendance.participant`).
 */
export interface EmbeddedFieldRef {
  /** id of the (outer) field holding the embedded object(s), e.g. "childrenAttendance" */
  outerProp: string;
  /** id of the nested property inside the embedded object, e.g. "participant" */
  innerProp: string;
  /** schema of the outer field */
  outerSchema: EntitySchemaField;
  /** schema of the nested property */
  innerSchema: EntitySchemaField;
  /** whether the outer field holds an array of embedded objects (as opposed to a single embedded object) */
  isArray: boolean;
}

/**
 * The datatype of the given field, if it is an embedded schema field
 * (e.g. `dataType: "schema-embed"` or `"attendance"`).
 */
export function getSchemaEmbedDatatype(
  schemaService: EntitySchemaService,
  field: EntitySchemaField | undefined,
): SchemaEmbedDatatype | undefined {
  if (!field?.dataType) {
    return undefined;
  }
  const datatype = schemaService.getDatatypeOrDefault(field.dataType, true);
  return datatype instanceof SchemaEmbedDatatype ? datatype : undefined;
}

/**
 * Build the map of inner schema fields of an embedded field,
 * the same way the datatype itself (de)serializes them (see {@link SchemaEmbedDatatype.getEffectiveSchema}).
 *
 * Returns `undefined` if the field is not an embedded schema field (i.e. has no inner fields).
 */
export function getEmbeddedSchema(
  schemaService: EntitySchemaService,
  field: EntitySchemaField | undefined,
): EntitySchema | undefined {
  const innerSchema = getSchemaEmbedDatatype(
    schemaService,
    field,
  )?.getEffectiveSchema(field);
  return innerSchema?.size > 0 ? innerSchema : undefined;
}

/**
 * The inner entity-reference properties of an embedded field
 * (e.g. the "participant" of an attendance field), resolved through the field's datatype,
 * so that inner fields only partially overridden in `additional` are included as well.
 */
export function getEmbeddedEntityReferenceFields(
  schemaService: EntitySchemaService,
  field: EntitySchemaField | undefined,
): [string, EntitySchemaField][] {
  return getInnerEntityReferenceFields(getEmbeddedSchema(schemaService, field));
}

/**
 * Resolve a field id that may reference a property nested inside an embedded field
 * (e.g. "childrenAttendance.participant") into its outer/inner schema parts.
 *
 * Returns `undefined` if the id does not reference such a nested property
 * (e.g. a normal, flat field id, or an invalid/unknown path).
 */
export function resolveEmbeddedField(
  schemaService: EntitySchemaService,
  entityConstructor: EntityConstructor<any>,
  fieldId: string,
): EmbeddedFieldRef | undefined {
  const separatorIndex = fieldId.indexOf(EMBEDDED_FIELD_ID_SEPARATOR);
  if (separatorIndex === -1) {
    return undefined;
  }

  const outerProp = fieldId.substring(0, separatorIndex);
  const innerProp = fieldId.substring(separatorIndex + 1);
  const outerSchema = entityConstructor.schema.get(outerProp);
  if (!outerSchema) {
    return undefined;
  }

  const datatype = getSchemaEmbedDatatype(schemaService, outerSchema);
  const innerSchema = datatype?.getEffectiveSchema(outerSchema).get(innerProp);
  if (!innerSchema) {
    return undefined;
  }

  return {
    outerProp,
    innerProp,
    outerSchema,
    innerSchema,
    isArray: datatype.holdsArray(outerSchema),
  };
}

/**
 * List all properties nested inside embedded fields of the given entity type
 * (e.g. "childrenAttendance.participant"), for offering them as filter (or other) options
 * in addition to the entity's normal, flat schema fields.
 */
export function getEmbeddedFieldRefs(
  schemaService: EntitySchemaService,
  entityConstructor: EntityConstructor<any>,
): EmbeddedFieldRef[] {
  const refs: EmbeddedFieldRef[] = [];
  for (const [outerProp, outerSchema] of entityConstructor.schema) {
    const datatype = getSchemaEmbedDatatype(schemaService, outerSchema);
    if (!datatype) {
      continue;
    }
    const innerSchema = datatype.getEffectiveSchema(outerSchema);
    const isArray = datatype.holdsArray(outerSchema);
    for (const [innerProp, fieldSchema] of innerSchema) {
      refs.push({
        outerProp,
        innerProp,
        outerSchema,
        innerSchema: fieldSchema,
        isArray,
      });
    }
  }
  return refs;
}

/**
 * The id referencing the given nested property, e.g. "childrenAttendance.participant".
 */
export function getEmbeddedFieldId(ref: EmbeddedFieldRef): string {
  return `${ref.outerProp}${EMBEDDED_FIELD_ID_SEPARATOR}${ref.innerProp}`;
}

/**
 * Compose the display label for a property nested inside an embedded field,
 * e.g. "Children attendance -> Participant".
 */
export function getEmbeddedFieldLabel(ref: EmbeddedFieldRef): string {
  const outerLabel =
    ref.outerSchema.labelShort ?? ref.outerSchema.label ?? ref.outerProp;
  const innerLabel =
    ref.innerSchema.labelShort ?? ref.innerSchema.label ?? ref.innerProp;
  return `${outerLabel} -> ${innerLabel}`;
}
