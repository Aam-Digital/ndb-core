import { DatabaseEntity } from "../entity/database-entity.decorator";
import { Entity } from "../entity/model/entity";
import { DatabaseField } from "../entity/database-field.decorator";
import { ColumnMapping } from "./column-mapping";
import { AdditionalImportAction } from "./additional-actions/additional-import-action";
import { ImportAdditionalSettings } from "./import-additional-settings/import-additional-settings.component";

/**
 * Details of a previously executed import of data saved to the database to keep a history.
 */
@DatabaseEntity("ImportMetadata")
export class ImportMetadata extends Entity {
  static override isInternalEntity = true;

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

  /**
   * @deprecated renamed to `createdEntities`
   */
  @DatabaseField() ids: string[];

  /**
   * IDs of the entities that were created during the import.
   */
  @DatabaseField() get createdEntities(): string[] {
    return this._createdEntities ?? this.ids;
  }

  set createdEntities(ids: string[]) {
    this._createdEntities = ids;
  }

  private _createdEntities: string[];

  /**
   * IDs of the entities that were updated during the import (already existed before the import)
   * and the previous values of those fields that have been overwritten.
   */
  @DatabaseField() updatedEntities: {
    id: string;
    importDataChanges: ImportDataChange;
  }[];
}

/**
 * Changes documented for a possible undo of an import.
 */
export interface ImportDataChange {
  [field: string]: { previousValue: any; importedValue: any };
}

/**
 * Settings required to execute an import including type and mappings.
 */
export interface ImportSettings {
  entityType: string;
  columnMapping: ColumnMapping[];

  /** configured actions to run in addition to the import to link data */
  additionalActions?: AdditionalImportAction[];

  /** IDs of fields used to match imported data to an existing record */
  matchExistingByFields?: string[];

  /** additional settings for parsing import data */
  additionalSettings?: ImportAdditionalSettings;

  filename?: string;
}
