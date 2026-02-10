import { Entity } from "../../core/entity/model/entity";
import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { LongTextDatatype } from "app/core/basic-datatypes/string/long-text.datatype";
import { FieldGroup } from "app/core/entity-details/form/field-group";
import { DefaultValueConfig } from "#src/app/core/default-values/default-value-config";

/**
 * Configuration for a single entity form within a public form.
 * Supports multiple entity types in one public form submission.
 */
export interface PublicFormEntityFormConfig {
  /**
   * The type of record that is created when someone submits the form.
   * (e.g. if you select "Note" here, the form will create new entries in your "Notes List"
   * and you can select only fields of your "Note" data structure for this form)
   */
  entity: string;

  /**
   * Fields to display in the form, organized into field groups/columns.
   */
  columns: FieldGroup[];

  /**
   * Fields with default/prefilled values.
   * Key is the field ID, value is the default value configuration.
   */
  prefilled?: { [key: string]: DefaultValueConfig };

  /**
   * Field IDs that link to other entities in the same form submission.
   * These fields will be automatically populated with IDs of entities created
   * by other forms in the same submission or passed as URL parameters.
   */
  linkedEntities?: string[];

  /**
   * Field IDs that should be linked from other forms in the same submission.
   * Uses schema metadata to decide which form's entity ID to apply.
   */
  linkedFromForm?: string[];
}

/**
 * Each entity of this type defines a new publicly accessible form
 * that can be reached through the given route even by users without being logged in
 * used in the public forms where we wanted to linked multiple entities in one form.
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

  /** @deprecated Use `forms` array instead for multi-form support */
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

  /** @deprecated Use `forms` array instead for multi-form support */
  @DatabaseField({
    label: $localize`:PublicFormConfig:Fields`,
    editComponent: "EditPublicFormColumns",
    isArray: true,
  })
  columns: FieldGroup[];

  /** @deprecated Use `forms` array instead for multi-form support */
  @DatabaseField({
    label: $localize`:PublicFormConfig:Prefilled Fields`,
    editComponent: "EditPrefilledValuesComponent",
  })
  prefilled: { [key: string]: DefaultValueConfig };

  /** @deprecated Use `forms` array instead for multi-form support */
  @DatabaseField({
    label: $localize`:PublicFormConfig:Linked Entities`,
    editComponent: "EditPublicFormRelatedEntitiesComponent",
    isArray: true,
  })
  linkedEntities: string[];

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

  override get isActive(): boolean {
    // hide the new style public forms (nested `forms` array) because the Admin UI is not ready yet
    // TODO: remove after implementing https://github.com/Aam-Digital/ndb-core/issues/3610
    if (this.forms?.length) {
      return false;
    }

    return super.isActive;
  }
}
