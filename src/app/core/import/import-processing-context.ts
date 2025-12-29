import { ImportSettings } from "#src/app/core/import/import-metadata";

/**
 * Object to store and share context and cached data
 * between parsing of multiple columns and rows of an import.
 *
 * (e.g. used for caching of entities when importing entity references)
 */
export class ImportProcessingContext {
  constructor(public readonly importSettings: ImportSettings) {}

  /**
   * Index of the currently imported row in the import file.
   */
  rowIndex: number = -1;

  /**
   * Full data of the currently imported row.
   */
  row: any;
}
