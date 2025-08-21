import { Injectable } from "@angular/core";
import { StringDatatype } from "./string.datatype";

/**
 * Datatype for email fields.
 */
@Injectable()
export class EmailDatatype extends StringDatatype {
  static override dataType = "email";
  static override label: string = $localize`:datatype-label:Email`;

  override viewComponent = "DisplayEmail";
  override editComponent = "EditEmail";
}
