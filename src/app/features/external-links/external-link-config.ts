import type { EditConditionConfig } from "#src/app/core/admin/building-blocks/edit-condition/edit-condition.component";
import { TranslatableText } from "#src/app/core/config/multi-lingual-config";
import { TranslatableTextDatatype } from "#src/app/core/config/translatable-text.datatype";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { DataFilter } from "#src/app/core/filter/filters/filters";

/**
 * A web address the link may open (the form validator and the service share it).
 */
export const WEB_ADDRESS_PATTERN = "https?://\\S+";

/** example of a link, kept out of the translated texts so that translators cannot change its placeholders */
const EXAMPLE_URL = "https://crm.example.org/contact?ref={d._id}&name={d.name}";

/**
 * Each entity of this type defines a link to an external site
 * that is offered in the actions menu of the records of one entity type.
 */
@DatabaseEntity("ExternalLinkConfig")
export class ExternalLinkConfig extends Entity {
  static override label = $localize`External Link`;
  static override labelPlural = $localize`External Links`;
  static override route = "admin/external-link";
  static override toStringAttributes = ["title"];
  static override isInternalEntity = true;

  @DatabaseField({
    label: $localize`Title`,
    description: $localize`The text of the menu item, e.g. "Open in Donor CRM".`,
    dataType: TranslatableTextDatatype.dataType,
    validators: { required: true },
  })
  title: TranslatableText;

  /**
   * The entity type whose records offer this link.
   */
  @DatabaseField({
    label: $localize`Record Type`,
    description: $localize`The link is shown in the "three dots" menu of records of this type.`,
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
    label: $localize`Link (URL)`,
    description: $localize`The web address to open, e.g. "${EXAMPLE_URL}:example:". Placeholders in curly brackets are replaced with values of the record.`,
    validators: {
      required: true,
      pattern: {
        pattern: WEB_ADDRESS_PATTERN,
        message: $localize`Enter a web address starting with "https://" (or "http://"), without spaces.`,
      },
    },
  })
  url: string;

  /**
   * Only records matching this condition offer the link. Without a condition, all records of the type do.
   */
  @DatabaseField({
    label: $localize`Condition`,
    description: $localize`The link is shown only for records matching this condition. Without a condition, it is shown for all records of the type.`,
    editComponent: "EditCondition",
    additional: {
      entityTypeField: "entity",
      explanation: $localize`This link is shown only for records matching...`,
    } satisfies EditConditionConfig,
  })
  condition?: DataFilter<Entity>;
}
