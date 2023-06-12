import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";

@DatabaseEntity("ImportMetadata")
export class ImportMetadata extends Entity {
  @DatabaseField({ label: "Date" }) date = new Date();
  @DatabaseField({ label: "User", dataType: "entity" }) user: string;
  @DatabaseField() config: ImportConfig;
  @DatabaseField() ids: string[];
}

export interface ImportConfig {
  entity: string;
  columnMapping: { property: string; additional: any }[];
}

/**
 * This interface stores all the setting done in the import wizard which define how data is imported
 */
export interface ImportMetaDataOld {
  /**
   * The entity type of the imported data based on the name provided with `@DatabaseEntity()`
   */
  entityType: string;

  /**
   * A unique identifier that will be prepended to the ID of each imported entity.
   * This allows to find the imported entities later which can be used to undo an import.
   * The 'transactionId' should be 8 characters long and the final entity ID will have the following format:
   * `<entityType>:<transactionId>-<9-characters-of-UUID>
   */
  transactionId?: string;

  /**
   * A map that defines which column should be imported into which entity property.
   */
  columnMap: ImportColumnMap;

  /**
   * The format for parsing the dates from the imported file.
   * Default is `YYYY-MM-DD`
   * For more information see {@link https://momentjs.com/docs/#/parsing/string-format/}
   */
  dateFormat?: string;

  /**
   * The entity type and id to which all imported entries should be linked.
   */
  linkEntity?: { type: string; id: string };
}

/**
 * A map that defines for each column of the input table (key) to which property of the entity (value) it should be mapped.
 * If a column should not be imported, the value should be `undefined`
 */
export type ImportColumnMap = {
  [key in string]: { key: string; label: string };
};
