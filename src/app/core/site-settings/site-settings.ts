import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { LOCALE_ENUM_ID } from "../language/languages";
import { ConfigurableEnumValue } from "../basic-datatypes/configurable-enum/configurable-enum.types";

/**
 * Global settings like styling and title to customize an instance of the app.
 * The settings are applied at runtime.
 */
@DatabaseEntity("SiteSettings")
export class SiteSettings extends Entity {
  static override isInternalEntity = true;

  static ENTITY_ID = "global";

  static create(value: Partial<SiteSettings>): SiteSettings {
    return Object.assign(new SiteSettings(), value);
  }

  @DatabaseField({ label: $localize`Site name` }) siteName: string =
    "Aam Digital - Demo";

  @DatabaseField({ label: $localize`Hide site name in toolbar` })
  hideSiteNameInToolbar: boolean = false;

  @DatabaseField({
    label: $localize`System language`,
    description: $localize`The language of the app for all users. If several languages are offered, users can switch to another one in their profile.`,
    dataType: "configurable-enum",
    additional: LOCALE_ENUM_ID,
  })
  defaultLanguage: ConfigurableEnumValue;

  @DatabaseField({
    label: $localize`Languages offered`,
    description: $localize`The languages admins can configure texts in and users can switch the app to. Leave empty to offer all of them.`,
    dataType: "configurable-enum",
    editComponent: "EditAvailableLocales",
    additional: LOCALE_ENUM_ID,
    isArray: true,
  })
  availableLocales: ConfigurableEnumValue[];

  @DatabaseField({
    label: $localize`Date format`,
    description: $localize`Select a predefined format or enter a custom date format string`,
    editComponent: "EditDateFormat",
  })
  dateFormat: string = "dd.MM.yyyy";

  @DatabaseField({
    label: $localize`Logo`,
    dataType: "file",
    editComponent: "EditPhoto",
    additional: 300,
  })
  logo: string;

  @DatabaseField({
    label: $localize`Primary color`,
    editComponent: "EditColor",
  })
  primary: string;
  @DatabaseField({
    label: $localize`Secondary color`,
    editComponent: "EditColor",
  })
  secondary: string;
  @DatabaseField({ label: $localize`Error color`, editComponent: "EditColor" })
  error: string;
  @DatabaseField({ label: $localize`Text font` }) font: string;

  constructor() {
    super(SiteSettings.ENTITY_ID);
  }

  override toString() {
    return this.getConstructor().label;
  }
}
