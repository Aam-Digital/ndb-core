import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";

/**
 * A general class that represents data that is collected for a entity over time.
 * Further attributes can be added through the config.
 */
@DatabaseEntity("HistoricalEntityData")
export class HistoricalEntityData extends Entity {
  @DatabaseField({ label: $localize`:Label for date of historical data:Date` })
  date: Date;
  @DatabaseField() relatedEntity: string;
}
