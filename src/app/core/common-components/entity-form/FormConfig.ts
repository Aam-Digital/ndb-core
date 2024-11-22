import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

/**
 * The general configuration for fields in tables and forms.
 * This defines which property is displayed and how it should be displayed.
 *
 * You can just provide the id as string or overwrite any EntitySchemaField property here as necessary.
 */
export interface FormFieldConfig extends EntitySchemaField {
  /**
   * The id of the entity which should be accessed
   */
  id: string;

  /**
   * When set to true, the sorting of this column will be disabled.
   * Should be used when the sorting will not work correctly/does not make sense.
   * E.g. when displaying a list of entities
   */
  noSorting?: boolean;

  /**
   * visibleFrom The minimal screen size where the column is shown.
   *           screen size classes: xs  'screen and (max-width: 599px)'
   *           sm  'screen and (min-width: 600px) and (max-width: 959px)'
   *           md  'screen and (min-width: 960px) and (max-width: 1279px)'
   *           lg  'screen and (min-width: 1280px) and (max-width: 1919px)'
   *           xl  'screen and (min-width: 1920px) and (max-width: 5000px)'
   */
  visibleFrom?: "xs" | "sm" | "md" | "lg" | "xl";

  /**
   * If true, the field will only be shown in forms and popups, but not in tables.
   */
  hideFromTable?: boolean;

  /**
   * If true, the field will only be shown in tables and excluded from forms and popups.
   * You can also use this to include a hidden form in a Public Form.
   *
   * The form field is still generated but hidden in the UI,
   * so default values can be applied to such hidden fields.
   */
  hideFromForm?: boolean;

  /**
   * An internal flag that will be automatically set in the entity subrecord in order to adapt the view/edit components.
   */
  forTable?: boolean;

  value?: string;
}

/**
 * Type for the definition of a single column in the EntitySubrecord
 */
export type ColumnConfig = string | FormFieldConfig;

export function toFormFieldConfig(column: ColumnConfig): FormFieldConfig {
  if (typeof column === "string") {
    return { id: column };
  } else {
    return column;
  }
}
