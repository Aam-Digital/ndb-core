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
  /** human-readable title of the report */
  @DatabaseField() title: string;

  /**
   * (optional) mode of export.
   * The {@link ReportEntity} holds the restriction on valid report modes.
   * Default is "reporting"
   */
  @DatabaseField() mode?: string;

  /**
   * version of ReportConfig syntax. Just relevant for SqlReports
   */
  @DatabaseField() version?: number = 1;

  /**
   * (sql v1 only) list of arguments needed for the sql query. Placeholder "?" will be replaced.
   */
  @DatabaseField() neededArgs?: string[] = [];

  /** (reporting/exporting only, in browser reports) the definitions to calculate the report's aggregations */
  @DatabaseField() aggregationDefinitions: any[] = [];

  /** (sql v1 only) the definition to calculate the report */
  @DatabaseField() aggregationDefinition: string | undefined = undefined;

  /**
   *  (sql v2 only) transformations that are applied to input variables (e.g. startDate, endDate)
   *  example: {startDate: ["SQL_FROM_DATE"], endDate: ["SQL_TO_DATE"]}
   */
  @DatabaseField() transformations: {
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
  @DatabaseField() reportDefinition: ReportDefinitionDto[];
}

export interface ReportDefinitionDto {
  query?: string;
  groupTitle?: String;
  items: ReportDefinitionDto[];
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
   * version of the ReportConfiguration, currently 1 or 2
   */
  version: number;

  /**
   * a valid SQL SELECT statements, can contain "?" placeholder for arguments (only v1)
   */
  aggregationDefinition: string;

  /**
   * a list of arguments, passed into the sql statement (only v1)
   */
  neededArgs: string[];

  /**
   *  (sql v2 only) transformations that are applied to input variables (e.g. startDate, endDate)
   *  example: {startDate: ["SQL_FROM_DATE"], endDate: ["SQL_TO_DATE"]}
   */
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
  reportDefinition: ReportDefinitionDto[];
}
