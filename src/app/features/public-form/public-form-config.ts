import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "app/core/basic-datatypes/string/long-text.datatype";
import { FieldGroup } from "app/core/entity-details/form/field-group";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { DefaultValueConfig } from "#src/app/core/default-values/default-value-config";

/**
 * Configuration for a single entity form within a public form.
 * Supports multiple entity types in one public form submission.
 */
export interface PublicFormEntityFormConfig {
  entity: string;
  columns: FieldGroup[];
  prefilled?: { [key: string]: DefaultValueConfig };
  prefilledFields?: FormFieldConfig[];
  linkedEntities?: FormFieldConfig[];
}

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
  static override isInternalEntity = true;

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
    label: $localize`:PublicFormConfig:Record`,
    description: $localize`:PublicFormConfig:The type of record that is created when a someone submits the form (e.g. if you select "Note" here, the form will create new entries in your "Notes List" and you can select only fields of your "Note" data structure for this form)`,
    editComponent: "EditEntityType",
    viewComponent: "DisplayEntityType",
    validators: {
      required: true,
      readonlyAfterSet: true,
    },
  })
  entity: string;

  @DatabaseField({
    label: $localize`:PublicFormConfig:Fields`,
    editComponent: "EditPublicFormColumns",
    isArray: true,
  })
  columns: FieldGroup[];

  @DatabaseField({
    label: $localize`:PublicFormConfig:Prefilled Fields`,
    editComponent: "EditPrefilledValuesComponent",
  })
  prefilled: { [key: string]: DefaultValueConfig };

  /** @deprecated old format */
  @DatabaseField()
  prefilledFields: FormFieldConfig[];

  @DatabaseField({
    label: $localize`:PublicFormConfig:Linked Entities`,
    editComponent: "EditPublicFormRelatedEntitiesComponent",
    isArray: true,
  })
  linkedEntities: FormFieldConfig[];

  @DatabaseField({
    label: $localize`:PublicFormConfig:Multiple Forms`,
    isArray: true,
  })
  forms: PublicFormEntityFormConfig[];

  @DatabaseField({
    label: $localize`:PublicFormConfig:Show "Submit Another Form" Button`,
    description: $localize`:PublicFormConfig:If enabled, users will see a "Submit Another Form" button after a successful submission. This helps when you want multiple submissions from the same user.`,
    dataType: "boolean",
  })
  showSubmitAnotherButton: boolean = false;
}
