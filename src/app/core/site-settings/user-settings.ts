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
  static override isInternalEntity = true;
  static override label = $localize`:UserSettings:User Settings`;

  @DatabaseField({
    label: $localize`Default language`,
    description: $localize`This will only be applied once the app is reloaded`,
    dataType: "configurable-enum",
    additional: LOCALE_ENUM_ID,
  })
  defaultLanguage: ConfigurableEnumValue;
}
