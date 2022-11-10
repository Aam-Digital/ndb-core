import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

@DatabaseEntity("School")
export class School extends Entity {
  static toStringAttributes = ["name"];
  static icon = "university";
  static label = $localize`:label for entity:School`;
  static labelPlural = $localize`:label (plural) for entity:Schools`;

  static getBlockComponent(): string {
    return "SchoolBlock";
  }

  static create(params: Partial<School>): School {
    const school = new School();
    Object.assign(school, params);
    return school;
  }

  @DatabaseField({
    label: $localize`:Label for the name of a school:Name`,
    validators: {
      required: true,
    },
  })
  name: string = "";
}
