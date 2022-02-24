import { Aggregation } from "../reporting.service";
import { ExportColumnConfig } from "../../../core/export/export-service/export-column-config";

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

  /** the definitions to calculate the report's aggregations */
  aggregationDefinitions?: Aggregation[] | ExportColumnConfig[];
}
