import { inject, Injectable } from "@angular/core";
import { AttendanceItem } from "../model/attendance-item";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";

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

  private readonly schemaService = inject(EntitySchemaService);

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
      result.push([
        item.participant ?? "",
        this.schemaService.transformEntityToDatabaseFormat(
          item as any,
          AttendanceItem.schema,
        ),
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
