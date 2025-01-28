import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "app/core/basic-datatypes/string/long-text.datatype";
import { FieldGroup } from "app/core/entity-details/form/field-group";

/**
 * Each entity of this type defines a new publicly accessible form
 * that can be reached through the given route even by users without being logged in.
 */
@DatabaseEntity("PublicFormConfig")
export class PublicFormConfig extends Entity {
  static override label = $localize`:PublicFormConfig:Public Form`;
  static override labelPlural = $localize`:PublicFormConfig:Public Forms`;
  static override route = "admin/public-form";
  static override toStringAttributes = ["title"];

  @DatabaseField({
    label: $localize`:PublicFormConfig:Form Logo`,
    description: $localize`:PublicFormConfig:Add an image to be displayed at the top of the form`,
    dataType: "file",
    additional: 300,
  })
  logo: string;

  @DatabaseField({
    label: $localize`:PublicFormConfig:Title`,
  })
  title: string;

  @DatabaseField({
    label: $localize`:PublicFormConfig:Form Link ID`,
    validators: {
      required: true,
    },
    editComponent: "EditPublicformRoute",
  })
  route: string;

  @DatabaseField({
    label: $localize`:PublicFormConfig:Description`,
    dataType: LongTextDatatype.dataType,
  })
  description: string;

  @DatabaseField({
    label: $localize`:PublicFormConfig:Entity`,
    description: $localize`:PublicFormConfig:The type of record that is created when a someone submits the form (e.g. if you select "Note" here, the form will create new entries in your "Notes List" and you can select only fields of your "Note" data structure for this form)`,
    editComponent: "EditEntityType",
    validators: {
      required: true,
    },
  })
  entity: string;

  @DatabaseField({
    label: $localize`:PublicFormConfig:Columns`,
    editComponent: "EditPublicFormColumns",
    isArray: true,
  })
  columns: FieldGroup[];

  /** @deprecated use ColumnConfig directly in the columns array instead */
  @DatabaseField() prefilled: { [key in string]: any };
}
