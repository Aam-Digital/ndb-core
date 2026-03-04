import { Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "#src/app/core/basic-datatypes/schema-embed/schema-embed.datatype";
import { AttendanceItem } from "./attendance-item";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EventAttendanceMapDatatype } from "../deprecated/event-attendance-map.datatype";

/**
 * Datatype for attendance tracking on any entity.
 *
 * Use this as `dataType: "attendance"` with `isArray: true` on an entity field
 * to store an array of {@link AttendanceItem} objects, each referencing a participant entity.
 *
 * The allowed entity types for the `participant` field can be overridden via
 * the field's `additional` config, e.g.:
 * ```json
 * {
 *   "dataType": "attendance",
 *   "isArray": true,
 *   "additional": {
 *     "participant": { "dataType": "entity", "additional": ["Child", "School"] }
 *   }
 * }
 * ```
 */
@Injectable()
export class AttendanceDatatype extends SchemaEmbedDatatype {
  static override readonly dataType = "attendance";
  static override label: string = $localize`:datatype-label:attendance (participants with status)`;

  override embeddedType = AttendanceItem;

  override editComponent = "EditAttendance";
  override viewComponent = "DisplayAttendance";

  override normalizeSchemaField(
    schemaField: EntitySchemaField,
  ): EntitySchemaField {
    // attendance always requires isArray
    return { ...schemaField, isArray: true };
  }

  /**
   * Detect the attendance field name from an entity's schema.
   *
   * Scans the schema for a field using the `attendance` or legacy `event-attendance-map` datatype
   * and returns its property name.
   *
   * @param entityOrType An entity instance or entity constructor to inspect.
   * @returns The field name of the first attendance-type field, or `undefined` if none is found.
   */
  static detectFieldInEntity(
    entityOrType: Entity | EntityConstructor,
  ): string | undefined {
    const schema =
      "schema" in entityOrType
        ? (entityOrType as EntityConstructor).schema
        : entityOrType.getConstructor().schema;

    for (const [fieldId, field] of schema.entries()) {
      if (
        field.dataType === AttendanceDatatype.dataType ||
        field.dataType === EventAttendanceMapDatatype.dataType
      ) {
        return fieldId;
      }
    }
    return undefined;
  }
}
