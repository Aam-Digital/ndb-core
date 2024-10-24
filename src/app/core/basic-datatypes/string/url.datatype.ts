import { Injectable } from "@angular/core";
import { StringDatatype } from "./string.datatype";

/**
 * Datatype for URL fields.
 */
@Injectable()
export class UrlDatatype extends StringDatatype {
  static override dataType = "url";
  static override label: string = $localize`:datatype-label:URL`;

  override viewComponent = "DisplayUrl";
}
