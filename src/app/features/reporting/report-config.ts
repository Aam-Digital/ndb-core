import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Aggregation } from "./data-aggregation.service";
import { ExportColumnConfig } from "../../core/export/data-transformation-service/export-column-config";
import { DatabaseField } from "../../core/entity/database-field.decorator";

/**
 * A report can be accessed by users to generate aggregated statistics or customized exports calculated from available data.
 * "read" permission for a ReportConfig entity is also used to control which users can generate the report's results.
 */
@DatabaseEntity("ReportConfig")
export class ReportConfig extends Entity {
  static create(data: Partial<ReportType>) {
    return Object.assign(new ReportConfig(), data) as ReportType;
  }

  /** human-readable title of the report */
  @DatabaseField() title: string;

  /**
   * (optional) mode of export.
   * Default is "reporting"
   */
  @DatabaseField() mode?: string;

  /** the definitions to calculate the report's aggregations */
  @DatabaseField() aggregationDefinitions?: any[];
}

/**
 * Reports handles by the {@class DataAggregationService}
 */
export class AggregationReport extends ReportConfig {
  mode: "reporting";
  aggregationDefinitions: Aggregation[];
}

/**
 * Reports handles by the {@class DataTransformationService}
 */
export class ExportingReport extends ReportConfig {
  /**
   * If no mode is set, it will default to 'exporting'
   */
  mode?: "exporting";
  aggregationDefinitions: ExportColumnConfig[];
}

/**
 * Reports handles by the {@class SqlReportService}
 */
export class SqlReport extends ReportConfig {
  mode: "sql";
  /**
   * Array of valid SQL SELECT statements
   */
  aggregationDefinitions: string[];
}

/**
 * Union type to enable type safety for report configs.
 * Use this instead of the {@class ReportConfig}
 */
export type ReportType = AggregationReport | ExportingReport | SqlReport;
