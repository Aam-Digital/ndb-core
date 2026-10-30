import { Injectable } from "@angular/core";
import { SchemaEmbedArrayDatatype } from "#src/app/core/basic-datatypes/schema-embed/schema-embed-array.datatype";
import { AttendanceItem } from "./attendance-item";
import { AttendanceLogicalStatus } from "./attendance-status";
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
export class AttendanceDatatype extends SchemaEmbedArrayDatatype {
  static override readonly dataType = "attendance";
  static override label: string = $localize`:datatype-label:attendance (participants with status)`;

  override embeddedType = AttendanceItem;

  override editComponent = "EditAttendance";
  override viewComponent = "DisplayAttendance";

  /**
   * Returns the attendance percentage (0–1) for use as the sort key in list columns.
   * Calculated as present / (present + absent), ignoring participants with IGNORE status (e.g. Excused).
   * Returns -1 if no participants have a countable status so empty attendance ("-")
   * sorts before a real 0% value.
   */
  override sortValue(fieldValue: AttendanceItem[]): number {
    const items = Array.isArray(fieldValue) ? fieldValue : [];
    let present = 0;
    let counted = 0;
    for (const item of items) {
      const countAs = item.status?.countAs;
      if (countAs === AttendanceLogicalStatus.PRESENT) {
        present++;
        counted++;
      } else if (countAs === AttendanceLogicalStatus.ABSENT) {
        counted++;
      }
    }
    return counted > 0 ? present / counted : -1;
  }

  private static readonly ATTENDANCE_DATATYPES = [
    AttendanceDatatype.dataType,
    EventAttendanceMapDatatype.dataType,
  ];

  /** @override Detects the first `attendance` or legacy `event-attendance-map` field in the entity schema. */
  static override detectFieldInEntity(
    entityOrType: Entity | EntityConstructor,
  ): string | undefined {
    return DefaultDatatype.detectFieldInEntity(
      entityOrType,
      AttendanceDatatype.ATTENDANCE_DATATYPES,
    );
  }

  /** Detect all `attendance` or legacy `event-attendance-map` fields in the entity schema. */
  static override detectAllFieldsInEntity(
    entityOrType: Entity | EntityConstructor,
  ): { fieldId: string; schemaField: EntitySchemaField }[] {
    return DefaultDatatype.detectAllFieldsInEntity(
      entityOrType,
      AttendanceDatatype.ATTENDANCE_DATATYPES,
    );
  }
}
