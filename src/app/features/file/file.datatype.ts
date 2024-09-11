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

  override viewComponent = "ViewFile";
  override editComponent = "EditFile";

  override async anonymize(
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

/**
 * (Optional) "additional" object to configure details of a "file" datatype / form field.
 */
export interface FileFieldConfig {
  /**
   * The accepted file types for file selection dialog.
   * If not defined, allows any file.
   */
  acceptedFileTypes?: string;

  /**
   * The maxSize to which the image will be automatically resized before upload.
   */
  imageCompression?: number;
}
