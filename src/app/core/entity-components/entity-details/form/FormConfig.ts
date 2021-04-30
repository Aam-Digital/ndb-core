import { PanelConfig } from "../EntityDetailsConfig";

export class FormConfig extends PanelConfig {
  cols: FormFieldConfig[][];
}

export class FormFieldConfig {
  /**
   * The input type for the form.
   * Available options: "photo", "text", "textarea", "checkbox", "age", "select", "configurable-enum-select", "datepicker"
   */
  input: string;

  /**
   * The id of the entity which should be accessed
   */
  id: string;

  /**
   * A placeholder or description of the expected input
   */
  placeholder: string;

  /**
   * If required is set to "true", the form cannot be saved if the field is empty.
   * Default to false
   */
  required: boolean = false;

  /**
   * The options in case `input="select"` is used.
   */
  options?: string[];

  /**
   * The id of the enum in case `input="configurable-enum-select" is used.
   */
  enumId?: string;
}
