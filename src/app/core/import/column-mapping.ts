/**
 * Mapping of a column from an import dataset to define how it should be imported exactly.
 */
export interface ColumnMapping {
  /** import data column header id */
  column: string;

  /** mapped entity property id */
  propertyName?: string;

  /**
   * details of data transformation or parsing into the property.
   *
   * e.g. date format to be parsed or key-value transformation map
   */
  additional?: any;

  /**
   * This is used to track if the coloumns are manually updated or not.
   */
  manuallyUpdated?: boolean;

  /**
   * How the user left the config dialog of this column, if its field requires one.
   *
   * `undefined` means the dialog was never opened, so the values are imported as they are
   * in the file. "cancelled" means the user closed it without saving, which blocks the import
   * until the mapping is confirmed.
   */
  configReview?: "confirmed" | "cancelled";
}
