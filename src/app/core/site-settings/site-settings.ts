import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { availableLocales, LOCALE_ENUM_ID } from "../language/languages";
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

  @DatabaseField({
    label: $localize`Default language`,
    description: $localize`This will only be applied once the app is reloaded`,
    dataType: "configurable-enum",
    additional: LOCALE_ENUM_ID,
  })
  defaultLanguage: ConfigurableEnumValue = availableLocales.values.find(
    ({ id }) => id === "en-US",
  );

  @DatabaseField({
    label: $localize`Display language select`,
  })
  displayLanguageSelect: boolean = true;

  @DatabaseField({
    label: $localize`Logo`,
    dataType: "file",
    editComponent: "EditPhoto",
    additional: 300,
  })
  logo: string;

  @DatabaseField({ label: $localize`Primary color` }) primary: string;
  @DatabaseField({ label: $localize`Secondary color` }) secondary: string;
  @DatabaseField({ label: $localize`Error color` }) error: string;
  @DatabaseField({ label: $localize`Text font` }) font: string;

  constructor() {
    super(SiteSettings.ENTITY_ID);
  }

  override toString() {
    return this.getConstructor().label;
  }
}
