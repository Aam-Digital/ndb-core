import { Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "../../../core/basic-datatypes/schema-embed/schema-embed.datatype";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { EventAttendance } from "./event-attendance";

@Injectable()
export class EventAttendanceDatatype extends SchemaEmbedDatatype {
  static override dataType = EventAttendance.DATA_TYPE;

  override embeddedType = EventAttendance as unknown as EntityConstructor;

  constructor(schemaService: EntitySchemaService) {
    super(schemaService);
  }
}
