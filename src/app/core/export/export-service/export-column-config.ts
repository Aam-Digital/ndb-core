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
   * One or more sub queries to expand one column into multiple columns and/or rows.
   *
   * The queries in the aggregations are executed based on the result(s) from the parent query where:
   * each object in the parent query result will lead to its own row in the final export (extending one object into multiple export rows);
   * each query in the aggregations will lead to one (or recursively more) columns in the export rows.
   *
   * e.g. `{ query: ".participants:toEntities(Child)", aggregations: [ {query: "name"}, {query: "phone"} ] }`
   * => parent query (not output in export): [{..child1}, {..child2}]
   * => overall result: two export rows: [{ name: "child1", phone: "123"}, {name: "child2", phone: "567"}]
   */
  aggregations?: ExportColumnConfig[];
}
