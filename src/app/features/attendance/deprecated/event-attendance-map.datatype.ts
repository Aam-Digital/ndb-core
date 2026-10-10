import { inject, Injectable } from "@angular/core";
import { AttendanceItem } from "../model/attendance-item";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import type { DataFilter } from "#src/app/core/filter/filters/filters";

/**
 * Holds a full register of EventAttendance entries.
 * Each value in the map is an {@link AttendanceItem}, transformed
 * using its schema annotations (via {@link EntitySchemaService}).
 *
 * @deprecated Use the new `attendance` datatype ({@link AttendanceDatatype}) with `isArray: true` instead.
 */
@Injectable()
export class EventAttendanceMapDatatype extends DefaultDatatype<
  AttendanceItem[],
  [string, any][]
> {
  static override dataType = "event-attendance-map";

  override editComponent = "EditAttendance";
  override viewComponent = "DisplayAttendance";

  private readonly schemaService = inject(EntitySchemaService);

  /**
   * Unlike the embedded objects of the `attendance` datatype, this one stores each entry as a
   * two-element tuple `[participantId, {status, remarks}]` (see {@link transformToDatabaseFormat}),
   * so the participant is matched by its *index* in that tuple rather than by a property name.
   *
   * `{$elemMatch: {"0": id}}` is the spelling that works on both query engines:
   * CouchDB's `mango_doc:get_field` accepts an integer path segment into an array, and
   * pouchdb-find resolves `tuple["0"]` the same way. The nesting that looks more natural,
   * `{$elemMatch: {$elemMatch: {$eq: id}}}`, silently matches nothing in pouchdb-find, which
   * treats the inner `$elemMatch` as a field name.
   */
  override getReferenceSelector(
    fieldId: string,
    schemaField: EntitySchemaField,
    referencedId: string,
  ): DataFilter<any>[] {
    return [{ [fieldId]: { $elemMatch: { "0": referencedId } } }];
  }

  override transformToDatabaseFormat(value: AttendanceItem[]) {
    if (!Array.isArray(value)) {
      console.warn(
        'property to be saved with "event-attendance-map" datatype is not of expected type',
        value,
      );
      return value as any;
    }

    const result: [string, any][] = [];
    for (const item of value) {
      const attItem = this.schemaService.transformEntityToDatabaseFormat(
        item as any,
        AttendanceItem.schema,
      );

      result.push([
        item.participant ?? "",
        { status: attItem.status, remarks: attItem.remarks },
      ]);
    }
    return result;
  }

  override transformToObjectFormat(value: any[]) {
    if (!Array.isArray(value) || value === null) {
      console.warn(
        'property to be loaded with "event-attendance-map" datatype is not valid',
        value,
      );
      return value as any;
    }

    const result: AttendanceItem[] = [];
    for (const keyValue of value) {
      const transformedValue =
        this.schemaService.transformDatabaseToEntityFormat<AttendanceItem>(
          keyValue[1],
          AttendanceItem.schema,
        );
      const instance = new AttendanceItem();
      Object.assign(instance, transformedValue);
      instance.participant = keyValue[0];
      result.push(instance);
    }
    return result;
  }
}
