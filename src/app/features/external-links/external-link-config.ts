import { TranslatableText } from "#src/app/core/config/multi-lingual-config";
import { TranslatableTextDatatype } from "#src/app/core/config/translatable-text.datatype";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { DataFilter } from "#src/app/core/filter/filters/filters";

/**
 * Each entity of this type defines a link to an external site
 * that is offered in the actions menu of the records of one entity type.
 */
@DatabaseEntity("ExternalLinkConfig")
export class ExternalLinkConfig extends Entity {
  static override label = $localize`:ExternalLinkConfig:External Link`;
  static override labelPlural = $localize`:ExternalLinkConfig:External Links`;
  static override route = "admin/external-link";
  static override toStringAttributes = ["title"];
  static override isInternalEntity = true;

  @DatabaseField({
    label: $localize`:ExternalLinkConfig:Title`,
    description: $localize`:ExternalLinkConfig:The text of the menu item, e.g. "Open in Donor CRM".`,
    dataType: TranslatableTextDatatype.dataType,
    validators: { required: true },
  })
  title: TranslatableText;

  /**
   * The entity type whose records offer this link.
   */
  @DatabaseField({
    label: $localize`:ExternalLinkConfig:Record Type`,
    description: $localize`:ExternalLinkConfig:The link is shown in the "three dots" menu of records of this type.`,
    editComponent: "EditEntityType",
    viewComponent: "DisplayEntityType",
    validators: { required: true },
  })
  entity: string;

  /**
   * The address to open, with placeholders for values of the record (`{d.fieldId}`)
   * and of the current user's record (`{c.user.fieldId}`).
   */
  @DatabaseField({
    label: $localize`:ExternalLinkConfig:Link (URL)`,
    description: $localize`:ExternalLinkConfig:The web address to open, e.g. "https://crm.example.org/contact?ref={d._id}&name={d.name}". Placeholders in curly brackets are replaced with values of the record.`,
    validators: {
      required: true,
      pattern: {
        pattern: "https?://\\S+",
        message: $localize`:ExternalLinkConfig:Enter a web address starting with "https://" (without spaces).`,
      },
    },
  })
  url: string;

  /**
   * Only records matching this condition offer the link. Without a condition, all records of the type do.
   */
  @DatabaseField({
    label: $localize`:ExternalLinkConfig:Condition`,
    editComponent: "EditExternalLinkCondition",
  })
  condition?: DataFilter<Entity>;
}
