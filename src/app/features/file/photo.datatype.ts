import { Injectable } from "@angular/core";
import { FileDatatype } from "./file.datatype";

/** Datatype for saving a photo on an entity property.*/

@Injectable()
export class PhotoDatatype extends FileDatatype {
  static override dataType = "photo";
  static override label: string = $localize`:datatype-label:profile photo`;

  override editComponent = "EditPhoto";
}
