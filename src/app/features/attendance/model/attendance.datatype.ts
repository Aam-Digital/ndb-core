import { Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "#src/app/core/basic-datatypes/schema-embed/schema-embed.datatype";
import { AttendanceItem, EventAttendanceMap } from "./attendance-item";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Datatype for a register of EventAttendance entries.
 *
 * Serializes `EventAttendanceMap` to/from arrays.
 * Supports both old tuple format `[[id, {status, remarks}], ...]`
 * and new object format `[{participantId, status, remarks}, ...]` for deserialization.
 */
@Injectable()
export class AttendanceDatatype extends SchemaEmbedDatatype {
  static override dataType = "attendance";

  override embeddedType = AttendanceItem;

  override viewComponent = "DisplayAttendance";
  override editComponent = "EditAttendance";

  override transformToDatabaseFormat(value: Map<string, any>) {
    if (!(value instanceof Map)) {
      Logging.warn(
        'property to be saved with "attendance" datatype is not of expected type',
        value,
      );
      return value as any;
    }

    const result: any[] = [];
    value.forEach((item, key) => {
      item.participantId = key;
      result.push(super.transformToDatabaseFormat(item));
    });
    return result;
  }

  override transformToObjectFormat(value: any[]) {
    if (value instanceof Map) {
      // usually this shouldn't already be a map but in MockDatabase somehow this can happen
      return value;
    }
    if (!Array.isArray(value) || value === null) {
      Logging.warn(
        'property to be loaded with "attendance" datatype is not valid',
        value,
      );
      return value as any;
    }

    const result = new EventAttendanceMap();
    for (const item of value) {
      const dbItem = this.migrateFromTupleFormat(item);
      const entry = super.transformToObjectFormat(
        dbItem,
      ) as unknown as AttendanceItem;
      result.set(entry.participantId, entry);
    }
    return result;
  }

  /**
   * Migrate old tuple format `[participantId, {status, remarks}]`
   * to new object format `{participantId, status, remarks}`.
   * If already in object format, returns as-is.
   */
  private migrateFromTupleFormat(item: any): any {
    if (Array.isArray(item)) {
      return { ...item[1], participantId: item[0] };
    }
    return item;
  }
}
