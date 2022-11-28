import { EntitySchemaDatatype } from "../../core/entity/schema/entity-schema-datatype";

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
export const fileDataType: EntitySchemaDatatype<string, string> = {
  name: "file",
  viewComponent: "ViewFile",
  editComponent: "EditFile",
  transformToDatabaseFormat: (value) => value,
  transformToObjectFormat: (value) => value,
};
