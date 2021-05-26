export interface FormConfig {
  cols: FormFieldConfig[][];
}

export interface FormFieldConfig {
  view?: string;

  edit?: string;

  /**
   * The id of the entity which should be accessed
   */
  id: string;

  /**
   * A placeholder or description of the expected input
   */
  placeholder?: string;

  /**
   * If required is set to "true", the form cannot be saved if the field is empty.
   * Default to false
   */
  required?: boolean;

  tooltip?: string;

  forTable?: boolean;

  noSorting?: boolean;

  additional?: any;

  visibleFrom?: string;
}
