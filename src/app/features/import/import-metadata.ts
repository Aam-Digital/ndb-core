import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { ColumnMapping } from "./column-mapping";

/**
 * Details of a previously executed import of data.
 */
@DatabaseEntity("ImportMetadata")
export class ImportMetadata extends Entity {
  static create(contents: Partial<ImportMetadata>) {
    return Object.assign(new ImportMetadata(), contents);
  }

  get date(): Date {
    return this.created?.at;
  }

  get user(): string {
    return this.created?.by;
  }

  @DatabaseField() config: {
    entityType: string;
    columnMapping: ColumnMapping[];
  };

  @DatabaseField() ids: string[];
}
