import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

@DatabaseEntity("School")
export class School extends Entity {
  static getBlockComponent(): string {
    return "SchoolBlock";
  }

  @DatabaseField({
    label: $localize`:Label for the name of a school:Name`,
    required: true,
  })
  name: string = "";
 
  public toString() {
    return this.name;
  }
}
