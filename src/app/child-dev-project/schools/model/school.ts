import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { IconName } from "@fortawesome/fontawesome-svg-core";

@DatabaseEntity("School")
export class School extends Entity {
  static override toStringAttributes = ["name"];
  static override icon: IconName = "university";
  static override label = $localize`:label for entity:School`;
  static override labelPlural = $localize`:label (plural) for entity:Schools`;
  static override color = "#9E9D24";
  static override hasPII = true;

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
