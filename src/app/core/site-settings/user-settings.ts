import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { LOCALE_ENUM_ID } from "../language/languages";
import { ConfigurableEnumValue } from "../basic-datatypes/configurable-enum/configurable-enum.types";

/**
 * Settings a user has chosen for their own account, stored under their account id.
 *
 * Separate from {@link SiteSettings} because permissions are granted per entity
 * type: sharing one type would mean granting write access to the site branding.
 */
@DatabaseEntity("UserSettings")
export class UserSettings extends Entity {
  static override readonly isInternalEntity = true;
  static override readonly label = $localize`:UserSettings:User Settings`;

  @DatabaseField({
    label: $localize`Default language`,
    description: $localize`This will only be applied once the app is reloaded`,
    dataType: "configurable-enum",
    additional: LOCALE_ENUM_ID,
  })
  defaultLanguage: ConfigurableEnumValue;

  /**
   * The user account id these settings belong to, i.e. the id of this document.
   *
   * Persisted so that permission rules can grant each user their own document
   * only (`"conditions": { "userId": "${user.id}" }`): rule variables replace a
   * whole value, so they cannot be matched against a part of the `_id`.
   */
  @DatabaseField() get userId(): string {
    return this.getId(true);
  }

  set userId(value: string) {
    // do not set manually, this is inferred from _id only
  }
}
