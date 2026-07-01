import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Aggregation } from "./data-aggregation.service";
import { ExportColumnConfig } from "../../core/export/data-transformation-service/export-column-config";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "../../core/basic-datatypes/string/long-text.datatype";
import { IconName } from "@fortawesome/fontawesome-svg-core";

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
  static override label = $localize`:ReportConfig:Report`;
  static override labelPlural = $localize`:ReportConfig:Reports`;
  static override toStringAttributes = ["title"];
  static override route = "admin/report-config";
  static override icon: IconName = "chart-line";

  /** human-readable title of the report */
  @DatabaseField({
    label: $localize`:ReportConfig:Title`,
    validators: { required: true },
  })
  title: string;

  /** longer description documenting the purpose and usage of this report */
  @DatabaseField({
    label: $localize`:ReportConfig:Description`,
    description: $localize`:ReportConfig:Document the purpose and usage of this report. This is also shown to users above the results when the report is run.`,
    dataType: LongTextDatatype.dataType,
  })
  description?: string;

  /**
   * (optional) mode of export.
   * The {@link ReportEntity} holds the restriction on valid report modes.
   * Default is "reporting"
   */
  @DatabaseField({
    label: $localize`:ReportConfig:Mode`,
    description: $localize`:ReportConfig:How the report is calculated: "reporting" (in-browser aggregations), "exporting" (data export) or "sql" (server-side SQL queries). Defaults to "reporting".`,
    editComponent: "EditReportMode",
    validators: { required: true },
  })
  mode?: string;

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

  /** (reporting/exporting only, in browser reports) the definitions to calculate the report's aggregations */
  @DatabaseField({
    label: $localize`:ReportConfig:Aggregation definitions`,
    description: $localize`:ReportConfig:Used for "reporting" and "exporting" mode reports (not SQL).`,
    editComponent: "EditJson",
  })
  aggregationDefinitions: any[];

  /**
   * @deprecated (will be removed completely after server-side migration)
   * (sql v1 only) the definition to calculate the report
   */
  @DatabaseField() aggregationDefinition?: string;

  /**
   *  (sql v2 only) transformations that are applied to input variables (e.g. startDate, endDate)
   *  example: {startDate: ["SQL_FROM_DATE"], endDate: ["SQL_TO_DATE"]}
   */
  @DatabaseField({
    label: $localize`:ReportConfig:Use report period (start & end date)`,
    description: $localize`:ReportConfig:When enabled, the report uses the selected start and end date of the report period as parameters (SQL mode).`,
    editComponent: "EditReportPeriodToggle",
  })
  transformations: {
    [key: string]: string[];
  };

  /**
   *  (sql v2 only) ReportDefinitionItem, ether ReportQuery or ReportGroup
   *
   *  Can be ReportQuery:
   *  {query: "SELECT * FROM foo"}
   *
   *  Can be ReportGroup:
   *  {groupTitle: "This is a group", items: [...]}
   *
   */
  @DatabaseField({
    label: $localize`:ReportConfig:Report definition (SQL queries)`,
    description: $localize`:ReportConfig:The SQL queries (and optional groups) calculated for "sql" mode reports.`,
    // Part A: edit as raw JSON; Part B replaces this with the structured "EditReportDefinition" editor.
    editComponent: "EditJson",
  })
  reportDefinition: ReportDefinitionDto[];
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
  aggregationDefinitions: Aggregation[];
}

/**
 * Reports handles by the {@class DataTransformationService}
 */
export interface ExportingReport extends ReportConfig {
  /**
   * If no mode is set, it will default to 'exporting'
   */
  mode?: "exporting";
  aggregationDefinitions: ExportColumnConfig[];
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
  const reportDefinition = report?.reportDefinition;
  if (!reportDefinition?.length) {
    return false;
  }
  return (
    reportDefinition.length > 1 ||
    reportDefinition.some((item) => !!item.groupTitle)
  );
}
