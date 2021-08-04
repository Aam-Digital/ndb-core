/**
 * Basic definition of a field / column to be included in an export through the ExportService.
 */
export interface ExportColumnConfig {
  /**
   * label shown in the header row.
   *
   * If not specified, query is used.
   */
  label?: string;

  /** property key or query to access the value for this column from the object to be exported */
  query: string;

  /**
   * whether a query that has multiple results (multiple entities related to the primary entity)
   * should be rolled out and result in one row for each of the related entities in the final export.
   *
   * Data from the primary entity is duplicated for each of the rows.
   */
  extendIntoMultipleRows?: boolean;
}
