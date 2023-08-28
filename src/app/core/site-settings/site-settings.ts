import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";

/**
 * Global settings like styling and title to customize an instance of the app.
 * The settings are applied at runtime.
 */
@DatabaseEntity("SiteSettings")
export class SiteSettings extends Entity {
  static ENTITY_ID = "global";
  static label = $localize`Site settings`;
  @DatabaseField({ label: $localize`Site name` }) siteName: string =
    "Aam Digital - Demo";
  // TODO should be enum?
  @DatabaseField({
    label: $localize`Language`,
    description: $localize`This will only be applied once the app is reloaded`,
  })
  language: string = "en-US";
  @DatabaseField({
    label: $localize`Display langauge select`,
  })
  displayLanguageSelect: boolean = true;
  @DatabaseField({
    label: $localize`Logo`,
    dataType: "file",
    editComponent: "EditPhoto",
  })
  logo: string;
  @DatabaseField({
    label: $localize`App favicon`,
    dataType: "file",
    editComponent: "EditPhoto",
  })
  favicon: string;
  @DatabaseField({ label: $localize`Primary color` }) primary: string;
  @DatabaseField({ label: $localize`Secondary color` }) secondary: string;
  @DatabaseField({ label: $localize`Error color` }) error: string;
  @DatabaseField({ label: $localize`Text font` }) font: string;

  // TODO implement?
  @DatabaseField({
    label: $localize`Use logo as icon`,
    dataType: "file",
    editComponent: "EditPhoto",
  })
  logoAsIcon = false;

  constructor() {
    super(SiteSettings.ENTITY_ID);
  }

  toString() {
    return this.getConstructor().label;
  }
}
