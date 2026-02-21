import { Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "#src/app/core/basic-datatypes/schema-embed/schema-embed.datatype";
import { AttendanceItem } from "./attendance-item";

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

  override embeddedType = AttendanceItem;

  override editComponent = "EditAttendance";
  override viewComponent = "DisplayAttendance";
}
