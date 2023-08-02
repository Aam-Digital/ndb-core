import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";

@DatabaseEntity("SiteSettings")
export class SiteSettings extends Entity {
  @DatabaseField({ label: $localize`Site name` }) siteName = "Aam Digital";
  @DatabaseField({ label: $localize`Language` }) language = "en-US";
  @DatabaseField({ label: $localize`Display langauge select` })
  displayLanguageSelect = true;
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
    super("test");
  }
}
