import { Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "../../../core/basic-datatypes/schema-embed/schema-embed.datatype";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { EventAttendance, EventAttendanceMap } from "./event-attendance";
import { DefaultDatatype } from "../../../core/entity/default-datatype/default.datatype";

/**
 * Holds a full register of EventAttendance entries.
 * (previously this was "MapDatatype")
 */
@Injectable()
export class EventAttendanceMapDatatype extends DefaultDatatype<
  Map<string, any>,
  [string, any][]
> {
  static override dataType = EventAttendanceMap.DATA_TYPE;

  embeddedType: EventAttendanceDatatype;

  constructor(schemaService: EntitySchemaService) {
    super();
    this.embeddedType = new EventAttendanceDatatype(schemaService);
  }

  transformToDatabaseFormat(value: Map<string, any>) {
    if (!(value instanceof Map)) {
      console.warn(
        'property to be saved with "map" EntitySchema is not of expected type',
        value,
      );
      return value as any;
    }

    const result: [string, any][] = [];
    value.forEach((item, key) => {
      result.push([key, this.embeddedType.transformToDatabaseFormat(item)]);
    });
    return result;
  }

  transformToObjectFormat(value: any[]) {
    if (value instanceof Map) {
      // usually this shouldn't already be a map but in MockDatabase somehow this can happen
      return value;
    }
    if (!Array.isArray(value) || value === null) {
      console.warn(
        'property to be loaded with "map" EntitySchema is not valid',
        value,
      );
      return value as any;
    }

    const result = new EventAttendanceMap();
    for (const keyValue of value) {
      const transformedElement = this.embeddedType.transformToObjectFormat(
        keyValue[1],
      ) as unknown as EventAttendance;
      result.set(keyValue[0], transformedElement);
    }
    return result;
  }
}

/** @deprecated do not use externally, use EventAttendanceMap instead **/
@Injectable()
export class EventAttendanceDatatype extends SchemaEmbedDatatype {
  static override dataType = EventAttendance.DATA_TYPE;

  override embeddedType = EventAttendance as unknown as EntityConstructor;

  constructor(schemaService: EntitySchemaService) {
    super(schemaService);
  }
}
