import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "../../core/basic-datatypes/string/long-text.datatype";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "#src/app/child-dev-project/notes/model/interaction-type.interface";

/**
 * EmailTemplate represents a reusable template for generating emails.
 *
 * An EmailTemplate stores the metadata and content needed to compose messages.
 * Admin users can create and manage these templates.
 */
@DatabaseEntity("EmailTemplate")
export class EmailTemplate extends Entity {
  static override label = $localize`:EmailTemplate:Email Template`;
  static override labelPlural = $localize`:EmailTemplate:Email Templates`;
  static override toStringAttributes = ["subject"];
  static override route = "admin/email-template";
  static override icon: IconName = "envelope";
  static override isInternalEntity = true;

  /**
   * Subject for the email.
   */
  @DatabaseField({
    label: $localize`:EmailTemplate:Subject`,
    validators: { required: true },
  })
  subject: string;

  /**
   * Body content for the email.
   */
  @DatabaseField({
    label: $localize`:EmailTemplate:Body`,
    dataType: LongTextDatatype.dataType,
    validators: { required: true },
  })
  body: string;

  /**
   * Optional entity types this template is available for.
   */
  @DatabaseField({
    label: $localize`:EmailTemplate:Available for Entity Type(s)`,
    editComponent: "EditEntityType",
    viewComponent: "DisplayEntityType",
    isArray: true,
  })
  availableForEntityTypes?: string;

  @DatabaseField({
    label: $localize`:EmailTemplate:Category`,
    description: $localize`:EmailTemplate:You can select a Note category here that is used for documenting a sent email in the record's related notes.`,
    dataType: "configurable-enum",
    additional: INTERACTION_TYPE_CONFIG_ID,
    anonymize: "retain",
    validators: { required: true },
  })
  category: InteractionType;
}
