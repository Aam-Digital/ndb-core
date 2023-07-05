/**
 * Mapping of a column from an import dataset to define how it should be imported exactly.
 */
export interface ColumnMapping {
  /** import data column header id */
  column: string;

  /** mapped entity property id */
  propertyName: string;

  /**
   * details of data transformation or parsing into the property.
   *
   * e.g. date format to be parsed or key-value transformation map
   */
  additional?: any;
}
