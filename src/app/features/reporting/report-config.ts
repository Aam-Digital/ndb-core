import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Aggregation } from "./data-aggregation.service";
import { ExportColumnConfig } from "../../core/export/data-transformation-service/export-column-config";
import { DatabaseField } from "../../core/entity/database-field.decorator";

/**
 * A report can be accessed by users to generate aggregated statistics or customized exports calculated from available data.
 * "read" permission for a ReportConfig entity is also used to control which users can generate the report's results.
 *
 * This is the class which is saved to the database.
 * However, when using this in code, use the {@link ReportEntity} instead which provides better type safety.
 */
@DatabaseEntity("ReportConfig")
class ReportConfig extends Entity {
  static override isInternalEntity = true;

  /** human-readable title of the report */
  @DatabaseField() title: string;

  /**
   * (optional) mode of export.
   * The {@link ReportEntity} holds the restriction on valid report modes.
   * Default is "reporting"
   */
  @DatabaseField() mode?: string;

  /**
   * @deprecated (will be removed completely after server-side migration)
   * Omitted for canonical configs (backend normalizes legacy v1 docs on read).
   */
  @DatabaseField() version?: number;

  /**
   * @deprecated (will be removed completely after server-side migration)
   * (sql v1 only) list of arguments needed for the sql query. Placeholder "?" will be replaced.
   */
  @DatabaseField() neededArgs?: string[] = [];

  /**
   * @deprecated Consolidated into {@link reportDefinition} by the one-time CLI migration
   * (consolidate-report-definition), which copies this into `reportDefinition` without deleting
   * it. Kept during the coexistence period so legacy docs still load and old code keeps working;
   * a follow-up migration removes it once every environment runs the new code.
   */
  @DatabaseField() aggregationDefinitions?: any[];

  /**
   * @deprecated (will be removed completely after server-side migration)
   * (sql v1 only) the definition to calculate the report
   */
  @DatabaseField() aggregationDefinition?: string;

  /**
   *  (sql v2 only) transformations that are applied to input variables (e.g. startDate, endDate)
   *  example: {startDate: ["SQL_FROM_DATE"], endDate: ["SQL_TO_DATE"]}
   */
  @DatabaseField() transformations: {
    [key: string]: string[];
  };

  /**
   * The single definition of what the report calculates. Its shape depends on {@link mode}:
   * - "sql":       {@link ReportDefinitionDto}[] — SQL queries and optional groups.
   * - "reporting": {@link Aggregation}[] — in-browser aggregation definitions.
   * - "exporting": {@link ExportColumnConfig}[] — export column definitions.
   *
   * Consolidated from the former `aggregationDefinitions` so all report modes share one field.
   */
  @DatabaseField()
  reportDefinition:
    ReportDefinitionDto[] | Aggregation[] | ExportColumnConfig[];
}

export interface ReportDefinitionDto {
  /** an SQL query */
  query?: string;

  /** title (human-readable) for a set of hierarchically grouped sub-items */
  groupTitle?: String;

  /** hierarchical child items, building a recursive set of report groups display in an indented way */
  items?: ReportDefinitionDto[];
}

/**
 * Union type to enable type safety for report configs.
 * Use this instead of the {@class ReportConfig}
 */
export type ReportEntity = AggregationReport | ExportingReport | SqlReport;
/**
 * This allows the `ReportEntity` to also be used as a constructor or in the `EntityMapper`
 */
export const ReportEntity = ReportConfig as EntityConstructor<ReportEntity>;

/**
 * Reports handles by the {@class DataAggregationService}
 */
export interface AggregationReport extends ReportConfig {
  mode: "reporting";
  reportDefinition: Aggregation[];
}

/**
 * Reports handles by the {@class DataTransformationService}
 */
export interface ExportingReport extends ReportConfig {
  /**
   * If no mode is set, it will default to 'exporting'
   */
  mode?: "exporting";
  reportDefinition: ExportColumnConfig[];
}

/**
 * Reports handles by the {@class SqlReportService}
 */
export interface SqlReport extends ReportConfig {
  mode: "sql";

  /**
   * @deprecated (will be removed completely after server-side migration)
   * Legacy version field. Omitted in canonical configs; backend normalizes on read.
   */
  version?: number;

  /**
   * @deprecated (will be removed completely after server-side migration)
   * (v1 only) a valid SQL SELECT statement, can contain "?" or "$name" placeholders
   */
  aggregationDefinition?: string;

  /**
   * @deprecated (will be removed completely after server-side migration)
   * (v1 only) list of argument names passed into the sql statement
   */
  neededArgs?: string[];

  /**
   * see ReportConfig docs
   */
  transformations: {
    [key: string]: string[];
  };

  /**
   *  see ReportConfig docs
   */
  reportDefinition: ReportDefinitionDto[];
}

/**
 * Whether a report's results should be rendered as a hierarchical group/count
 * table (`sql-v2-table`) rather than a flat tabular table (`object-table`).
 *
 * Derived purely from the canonical config structure (no version flag):
 * a report is hierarchical when its `reportDefinition` contains a group
 * (`groupTitle`) or more than one top-level item; otherwise it is tabular.
 * Legacy v1 configs (normalized to a single ungrouped query) resolve to tabular.
 */
export function isHierarchicalReport(
  report: ReportEntity | undefined,
): boolean {
  const reportDefinition = report?.reportDefinition as
    ReportDefinitionDto[] | undefined;
  if (!reportDefinition?.length) {
    return false;
  }
  return (
    reportDefinition.length > 1 ||
    reportDefinition.some((item) => !!item.groupTitle)
  );
}
