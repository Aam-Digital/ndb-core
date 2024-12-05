import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";

/**
 * (ESCO) Skill record as stored for the internal business logic of our application.
 *
 * Also see EscoApiService
 */
@DatabaseEntity("Skill")
export class Skill extends Entity {
  static override label = $localize`:label for entity:Skill`;
  static override labelPlural = $localize`:label (plural) for entity:Skills`;
  static override toStringAttributes = ["name"];
  static override toBlockDetailsAttributes = {
    title: "name",
    fields: ["description", "escoUri"],
  };
  static override hasPII = false;

  static create(escoUri: string, name: string, description?: string): Skill {
    const skill = new Skill(escoUri);
    skill.name = name;
    skill.escoUri = escoUri;
    skill.description = description;
    return skill;
  }

  @DatabaseField({ label: $localize`:Label:Skill Name` })
  name: string;

  @DatabaseField({ label: $localize`:Label:ESCO URI` })
  escoUri: string;

  @DatabaseField({
    label: $localize`:Label:Description`,
    dataType: "long-text",
  })
  description: string;
}
