import { Entity } from "../../core/entity/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";

@DatabaseEntity("HistoricalEntityData")
export class HistoricalEntityData extends Entity {
  @DatabaseField() date: Date;
  @DatabaseField() relatedEntity: string;
}
