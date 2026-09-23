/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { EntityConstructor } from "../model/entity";
import { EntitySchema, SchemaEmbeddedType } from "./entity-schema";
import { EntitySchemaField } from "./entity-schema-field";
import { EntitySchemaService } from "./entity-schema.service";

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
 * Datatypes whose values are always an array of embedded items, even though their schema field
 * does not (and, given how their (de)serialization is implemented, structurally cannot) declare
 * `isArray: true` itself - unlike their modern replacement (e.g. `AttendanceDatatype`), which
 * enforces `isArray: true` via `normalizeSchemaField`.
 *
 * @deprecated only needed for backwards compatibility with this legacy datatype
 */
const ALWAYS_ARRAY_EMBEDDED_DATATYPES = new Set(["event-attendance-map"]);

/**
 * Whether the given (outer) schema field holds an array of embedded objects
 * (as opposed to a single embedded object).
 */
function isEmbeddedArrayField(field: EntitySchemaField): boolean {
  return (
    field.isArray === true ||
    ALWAYS_ARRAY_EMBEDDED_DATATYPES.has(field.dataType)
  );
}

/**
 * Build the map of inner schema fields of an embedded field
 * (e.g. `dataType: "schema-embed"`, `"schema-embed-array"`, `"attendance"`
 * or the deprecated `"event-attendance-map"`).
 *
 * This merges the datatype's own `embeddedType` class schema (if the datatype declares one,
 * e.g. {@link AttendanceDatatype}) with the field's `additional` config
 * (a `{ [fieldId]: EntitySchemaField }` map), the latter taking precedence -
 * mirroring how `SchemaEmbedDatatype.getEffectiveSchema` merges these two sources.
 *
 * Returns `undefined` if the field is not an embedded schema field (i.e. has no inner fields).
 */
export function getEmbeddedSchema(
  schemaService: EntitySchemaService,
  field: EntitySchemaField | undefined,
): EntitySchema | undefined {
  if (!field?.dataType) {
    return undefined;
  }

  const datatype = schemaService.getDatatypeOrDefault(field.dataType, true);
  const embeddedType: SchemaEmbeddedType | undefined = (datatype as any)
    ?.embeddedType;
  const innerSchema: EntitySchema = new Map(embeddedType?.schema ?? []);

  const additional = field.additional;
  if (
    additional &&
    typeof additional === "object" &&
    !Array.isArray(additional)
  ) {
    for (const [key, value] of Object.entries<EntitySchemaField>(additional)) {
      if (
        value &&
        typeof value === "object" &&
        typeof value.dataType === "string"
      ) {
        innerSchema.set(key, { ...value, id: key });
      }
    }
  }

  return innerSchema.size > 0 ? innerSchema : undefined;
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

  const innerSchema = getEmbeddedSchema(schemaService, outerSchema)?.get(
    innerProp,
  );
  if (!innerSchema) {
    return undefined;
  }

  return {
    outerProp,
    innerProp,
    outerSchema,
    innerSchema,
    isArray: isEmbeddedArrayField(outerSchema),
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
    const innerSchema = getEmbeddedSchema(schemaService, outerSchema);
    if (!innerSchema) {
      continue;
    }
    const isArray = isEmbeddedArrayField(outerSchema);
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
