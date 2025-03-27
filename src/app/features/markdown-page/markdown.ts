import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { Entity } from "app/core/entity/model/entity";

@DatabaseEntity("Markdown")
class Markdown extends Entity {
  @DatabaseField() title: string;

  @DatabaseField() content: string;
}
