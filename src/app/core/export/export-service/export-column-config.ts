/**
 * Basic definition of a field / column to be included in an export through the ExportService.
 */
export interface ExportColumnConfig {
  /**
   * label shown in the header row.
   *
   * If not specified, key is used.
   */
  label?: string;

  /** property key to access the value for this column from the object to be exported */
  key: string;
}
