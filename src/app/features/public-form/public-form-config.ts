import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";

@DatabaseEntity("PublicFormConfig")
export class PublicFormConfig extends Entity {
  @DatabaseField() title: string;
  @DatabaseField() description: string;
  @DatabaseField() entity: string;
  @DatabaseField() columns: string[][];
  @DatabaseField() prefilled: { [key in string]: any };
}
