import { StringDatatype } from "../../core/entity/schema-datatypes/string.datatype";
import { Injectable } from "@angular/core";

/**
 * Datatype for saving a file on an entity property.
 *
 * The name of the file is saved on the property while the file itself is stored in another database.
 *
 * Usage in code:
 * ```javascript
 * @DatabaseProperty({ dataType: "file", label: "My label"}) myFileProperty: string;
 * ```
 * Usage in config:
 * ```json
 * {
 *   "name": "myFileProperty",
 *   "schema": {
 *     "dataType": "file",
 *     "label": "My label"
 *   }
 * }
 * ```
 */
@Injectable()
export class FileDatatype extends StringDatatype {
  static dataType = "file";
  viewComponent = "ViewFile";
  editComponent = "EditFile";
}
