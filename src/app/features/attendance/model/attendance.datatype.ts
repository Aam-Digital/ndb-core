import { Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "#src/app/core/basic-datatypes/schema-embed/schema-embed.datatype";
import { AttendanceItem } from "./attendance-item";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { EventAttendanceMapDatatype } from "../deprecated/event-attendance-map.datatype";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";

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

  /** @override Detects the first `attendance` or legacy `event-attendance-map` field in the entity schema. */
  static override detectFieldInEntity(
    entityOrType: Entity | EntityConstructor,
  ): string | undefined {
    return DefaultDatatype.detectFieldInEntity(entityOrType, [
      AttendanceDatatype.dataType,
      EventAttendanceMapDatatype.dataType,
    ]);
  }
}
