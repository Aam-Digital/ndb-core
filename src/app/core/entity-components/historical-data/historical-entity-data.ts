import { Entity } from "../../entity/entity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { DatabaseField } from "../../entity/database-field.decorator";

@DatabaseEntity("HistoricalEntityData")
export class HistoricalEntityData extends Entity {
  @DatabaseField() date: Date;
  @DatabaseField() relatedEntity: string;
}
