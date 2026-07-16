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
  static override readonly label = $localize`:ReportConfig:Report`;
  static override readonly labelPlural = $localize`:ReportConfig:Reports`;
  static override readonly toStringAttributes = ["title"];
  static override readonly route = "admin/report-config";
  static override readonly icon: IconName = "chart-line";

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
  @DatabaseField({
    label: $localize`:ReportConfig:Use report period (start & end date)`,
    description: $localize`:ReportConfig:When you use time filters in your report, users see a date range selector to choose the start and end date for the report when calculating results.`,
    editComponent: "EditReportPeriodToggle",
  })
  transformations: {
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
  @DatabaseField({
    label: $localize`:ReportConfig:Report definition`,
    description: $localize`:ReportConfig:The definition of what the report calculates: SQL queries for "sql" mode, or aggregation/export definitions for "reporting"/"exporting" mode.`,
    // Part B replaces this with the structured "EditReportDefinition" editor (sql mode).
    editComponent: "EditJson",
  })
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

/**
 * Whether running this report offers a date-range (start & end date) input.
 *
 * - "sql": only if the query uses the `$startDate` / `$endDate` placeholders — for SQL the
 *   date range has to be mapped explicitly, so it is derived from the query instead of a
 *   separate flag that can get out of sync.
 * - "reporting"/"exporting": always — in-browser reports are always run over the selected
 *   report period.
 */
export function reportUsesDateRange(
  report: { mode?: string; reportDefinition?: unknown } | undefined,
): boolean {
  if (!report) {
    return false;
  }
  if (report.mode === "sql") {
    const queries = collectQueryStrings(report.reportDefinition);
    return queries.some((query) => /\$startDate|\$endDate/.test(query));
  }
  return true;
}

/** Recursively collect every `query` string value from a report definition tree. */
function collectQueryStrings(node: unknown): string[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectQueryStrings);
  }
  if (node && typeof node === "object") {
    const out: string[] = [];
    for (const [key, value] of Object.entries(node)) {
      if (key === "query" && typeof value === "string") {
        out.push(value);
      } else {
        out.push(...collectQueryStrings(value));
      }
    }
    return out;
  }
  return [];
}
