import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { PLACEHOLDERS } from "../../../core/entity/schema/entity-schema-field";
import { Child } from "../../../child-dev-project/children/model/child";

/**
 * A general class that represents data that is collected for a entity over time.
 * Further attributes can be added through the config.
 */
@DatabaseEntity("HistoricalEntityData")
export class HistoricalEntityData extends Entity {
  static override hasPII = true;

  @DatabaseField({
    label: $localize`:Label for date of historical data:Date`,
    defaultValue: {
      mode: "dynamic",
      value: PLACEHOLDERS.NOW,
    },
    anonymize: "retain-anonymized",
  })
  date: Date;

  @DatabaseField({
    dataType: "entity",
    additional: Child.ENTITY_TYPE,
    entityReferenceRole: "composite",
    anonymize: "retain",
  })
  relatedEntity: string;
}
