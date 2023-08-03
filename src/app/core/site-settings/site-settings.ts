import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";

@DatabaseEntity("SiteSettings")
export class SiteSettings extends Entity {
  @DatabaseField({ label: $localize`Site name` }) siteName: string =
    "Aam Digital";
  // TODO should be enum?
  @DatabaseField({ label: $localize`Language` }) language: string = "en-US";
  @DatabaseField({
    label: $localize`Display langauge select`,
    description: $localize`This will only be applied once the app is reloaded`,
  })
  displayLanguageSelect: boolean = true;
  @DatabaseField({
    label: $localize`Logo`,
    dataType: "file",
    editComponent: "EditPhoto",
  })
  logo: string;
  @DatabaseField({
    label: $localize`App icon`,
    dataType: "file",
    editComponent: "EditPhoto",
  })
  icon: string;
  @DatabaseField({
    label: $localize`Use logo as icon`,
    dataType: "file",
    editComponent: "EditPhoto",
  })
  logoAsIcon = false;

  constructor() {
    // TODO fix id
    super("test");
  }
}
