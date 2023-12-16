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

  /** the definitions to calculate the report's aggregations */
  @DatabaseField() aggregationDefinitions: any[] = [];
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
   * Array of valid SQL SELECT statements
   */
  aggregationDefinitions: string[];
}
