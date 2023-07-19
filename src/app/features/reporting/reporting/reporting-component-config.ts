import { Aggregation } from "../data-aggregation.service";
import { ExportColumnConfig } from "../../../core/export/data-transformation-service/export-column-config";

/**
 * The config object format that can be set for this component in the config database
 * specifying all available reports.
 */
export interface ReportingComponentConfig {
  /** array of available reports */
  reports: ReportConfig[];
}

/**
 * The config for one specific report that can be selected and calculated.
 */
export interface ReportConfig {
  /** human-readable title of the report */
  title: string;

  /**
   * (optional) mode whether the aggregation definitions are of type {@interface Aggregation} or {@interface ExportColumnConfig}
   * Default is "reporting"
   */
  mode?: "reporting" | "exporting";

  /** the definitions to calculate the report's aggregations */
  aggregationDefinitions?: Aggregation[] | ExportColumnConfig[];
}
