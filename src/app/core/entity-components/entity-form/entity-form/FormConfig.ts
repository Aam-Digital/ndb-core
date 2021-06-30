/**
 * The general configuration for fields in tables and forms.
 * This defines which property is displayed and how it should be displayed.
 * Most information does not need to be provided if a property with schema definitions is displayed.
 */
export interface FormFieldConfig {
  /**
   * The id of the entity which should be accessed
   */
  id: string;

  /**
   * Defines the component that should display this form field.
   *
   * The name has to match one of the strings in the DYNAMIC_COMPONENT_MAP.
   * If nothing is defined, the component specified in the schema for this property or the default component of the
   * property's datatype will be used.
   */
  view?: string;

  /**
   * Defines the component which allows to edit this form field.
   *
   * The name has to match one of the strings in the DYNAMIC_COMPONENT_MAP.
   * If nothing is defined, the component specified in the schema for this property or the default component of the
   * property's datatype will be used. If nothing is found, the form field will be displayed in the "view" mode.
   */
  edit?: string;

  /**
   * A label or description of the expected input
   */
  label?: string;

  /**
   * If required is set to "true", the form cannot be saved if the field is empty.
   * Default to false
   */
  required?: boolean;

  /**
   * An additional description which explains this form field.
   *
   * If nothing is specified, the property schemas "description" field will be used.
   */
  tooltip?: string;

  /**
   * When set to true, the sorting of this column will be disabled.
   * Should be used when the sorting will not work correctly/does not make sense.
   * E.g. when displaying a list of entities
   */
  noSorting?: boolean;

  /**
   * Further information for the final view/edit component.
   * This is necessary when displaying columns where no schema is available, e.g. to display "readonly-functions".
   * This should only be used in cases where a property without schema information is displayed.
   */
  additional?: any;

  /**
   * visibleFrom The minimal screen size where the column is shown.
   *           screen size classes: xs  'screen and (max-width: 599px)'
   *           sm  'screen and (min-width: 600px) and (max-width: 959px)'
   *           md  'screen and (min-width: 960px) and (max-width: 1279px)'
   *           lg  'screen and (min-width: 1280px) and (max-width: 1919px)'
   *           xl  'screen and (min-width: 1920px) and (max-width: 5000px)'
   */
  visibleFrom?: string;

  /**
   * A internal flag that will be automatically set in the entity subrecord in order to adapt the view/edit components.
   */
  forTable?: boolean;
}
