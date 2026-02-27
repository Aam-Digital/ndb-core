import { Injectable } from "@angular/core";
import { SchemaEmbedDatatype } from "#src/app/core/basic-datatypes/schema-embed/schema-embed.datatype";
import { AttendanceItem } from "./attendance-item";

@Injectable()
export class AttendanceItemDatatype extends SchemaEmbedDatatype {
  static override dataType = AttendanceItem.DATA_TYPE;

  override embeddedType = AttendanceItem;
}
