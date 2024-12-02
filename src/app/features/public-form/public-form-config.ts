import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "app/core/basic-datatypes/string/long-text.datatype";
import { FieldGroup } from "app/core/entity-details/form/field-group";

@DatabaseEntity("PublicFormConfig")
export class PublicFormConfig extends Entity {
  static override label = $localize`:PublicFormConfig:Public Form`;
  static override labelPlural = $localize`:PublicFormConfig:Public Forms`;
  static override route = "admin/public-form";

  @DatabaseField({
    label: $localize`:PublicFormConfig:Title`,
  })
  title: string;

  @DatabaseField({
    label: $localize`:PublicFormConfig:Public form Route`,
    description: $localize`:PublicFormConfig:This will be the Public form Link from where the users can access this form`,
  })
  route: string;

  @DatabaseField({
    label: $localize`:PublicFormConfig:Description`,
    dataType: LongTextDatatype.dataType,
  })
  description: string;
  @DatabaseField({
    label: $localize`:PublicFormConfig:Entity`,
    editComponent: "EditEntityTypeDropdown",
  })
  entity: string;
  @DatabaseField({
    label: $localize`:PublicFormConfig:Columns`,
    isArray: true,
  })
  columns: FieldGroup[];
  /** @deprecated use ColumnConfig directly in the columns array instead */
  @DatabaseField() prefilled: { [key in string]: any };
}
