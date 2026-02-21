import { DatabaseField } from "../database-field.decorator";
import { EntitySchema } from "../schema/entity-schema";

/**
 * Object to store metadata about a "revision" of a document including date and author of the change.
 */
export class UpdateMetadata {
  static DATA_TYPE = "update-metadata";
  declare static schema: EntitySchema;

  /** when the update was saved to db */
  @DatabaseField() at: Date;

  /** username who saved the update */
  @DatabaseField() by: string;

  constructor(by: string = undefined, at: Date = new Date()) {
    this.by = by;
    this.at = at;
  }
}
