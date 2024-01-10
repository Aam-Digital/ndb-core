import { StringDatatype } from "../../core/basic-datatypes/string/string.datatype";
import { Injectable } from "@angular/core";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";

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
  static override dataType = "file";
  static override label: string = $localize`:datatype-label:file attachment`;

  viewComponent = "ViewFile";
  editComponent = "EditFile";

  async anonymize(
    value: string,
    schemaField: EntitySchemaField,
    parent: any,
  ): Promise<any> {
    // accessing the id of the entity property seems difficult here
    // file anonymization requires the FileService to actively delete - not supporting partial anonymization for now
    // --> see EntityRemoveService for full anonymization, removing files
    throw new Error(
      "'retain-anonymized' is not implemented for 'file' datatype",
    );
  }
}
