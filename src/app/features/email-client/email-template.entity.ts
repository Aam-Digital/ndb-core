import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "../../core/basic-datatypes/string/long-text.datatype";

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
}
