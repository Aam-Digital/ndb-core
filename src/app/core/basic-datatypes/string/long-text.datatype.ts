import { Injectable } from "@angular/core";
import { StringDatatype } from "./string.datatype";

/**
 * Datatype for multi-line string fields.
 */
@Injectable()
export class LongTextDatatype extends StringDatatype {
  static override dataType = "long-text";
  static override label: string = $localize`:datatype-label:text (long)`;

  editComponent: "EditLongText";
}
