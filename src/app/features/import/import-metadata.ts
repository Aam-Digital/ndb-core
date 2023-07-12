import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { ColumnMapping } from "./column-mapping";
import { AdditionalImportAction } from "./import-additional-actions/additional-import-action";

/**
 * Details of a previously executed import of data saved to the database to keep a history.
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

  @DatabaseField() config: ImportSettings;

  @DatabaseField() ids: string[];
}

/**
 * Settings required to execute an import including type and mappings.
 */
export interface ImportSettings {
  entityType: string;
  columnMapping: ColumnMapping[];
  additionalActions?: AdditionalImportAction[];
}
