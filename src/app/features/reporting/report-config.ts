import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Aggregation } from "./data-aggregation.service";
import { ExportColumnConfig } from "../../core/export/data-transformation-service/export-column-config";
import { DatabaseField } from "../../core/entity/database-field.decorator";

@DatabaseEntity("ReportConfig")
export class ReportConfig extends Entity {
  /** human-readable title of the report */
  @DatabaseField() title: string;

  /**
   * (optional) mode whether the aggregation definitions are of type {@interface Aggregation} or {@interface ExportColumnConfig}
   * Default is "reporting"
   */
  @DatabaseField() mode?: "reporting" | "exporting";

  /** the definitions to calculate the report's aggregations */
  @DatabaseField() aggregationDefinitions?:
    | Aggregation[]
    | ExportColumnConfig[];
}
