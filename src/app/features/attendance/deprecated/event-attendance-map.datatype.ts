import { inject, Injectable } from "@angular/core";
import { AttendanceItem } from "../model/attendance-item";
import { DefaultDatatype } from "#src/app/core/entity/default-datatype/default.datatype";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";

/**
 * A full registry of event-attendance entries for multiple participants.
 *
 * @deprecated Use the new `attendance` datatype ({@link AttendanceDatatype}) with `isArray: true` instead.
 */
export class EventAttendanceMap extends Map<string, AttendanceItem> {
  static DATA_TYPE = "event-attendance-map";

  constructor() {
    super();
  }
}

/**
 * Holds a full register of EventAttendance entries.
 * Each value in the map is an {@link AttendanceItem}, transformed
 * using its schema annotations (via {@link EntitySchemaService}).
 *
 * @deprecated Use the new `attendance` datatype ({@link AttendanceDatatype}) with `isArray: true` instead.
 */
@Injectable()
export class EventAttendanceMapDatatype extends DefaultDatatype<
  Map<string, any>,
  [string, any][]
> {
  static override dataType = EventAttendanceMap.DATA_TYPE;

  private readonly schemaService = inject(EntitySchemaService);

  override transformToDatabaseFormat(value: Map<string, any>) {
    if (!(value instanceof Map)) {
      console.warn(
        'property to be saved with "map" RecordSchema is not of expected type',
        value,
      );
      return value as any;
    }

    const result: [string, any][] = [];
    value.forEach((item, key) => {
      result.push([
        key,
        this.schemaService.transformEntityToDatabaseFormat(
          item,
          AttendanceItem.schema,
        ),
      ]);
    });
    return result;
  }

  override transformToObjectFormat(value: any[]) {
    if (value instanceof Map) {
      // usually this shouldn't already be a map but in MockDatabase somehow this can happen
      return value;
    }
    if (!Array.isArray(value) || value === null) {
      console.warn(
        'property to be loaded with "map" RecordSchema is not valid',
        value,
      );
      return value as any;
    }

    const result = new EventAttendanceMap();
    for (const keyValue of value) {
      const transformedValue =
        this.schemaService.transformDatabaseToEntityFormat<AttendanceItem>(
          keyValue[1],
          AttendanceItem.schema,
        );
      const instance = new AttendanceItem();
      Object.assign(instance, transformedValue);
      result.set(keyValue[0], instance);
    }
    return result;
  }
}
