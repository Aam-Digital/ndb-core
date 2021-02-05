import { Entity } from "../../entity/entity";

export class EntityDetailsConfig {
  icon: string;
  entity: string;
  panels: Panel[];
}

export class Panel {
  title: string;
  components: PanelComponent[];
}

export class PanelComponent {
  title: string;
  component: string;
  config?: PanelConfig;
}

export class PanelConfig {
  entity: Entity;
  creatingNew?: boolean;
  config?: any;
}

export class FormConfig {
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
  required: boolean;

  /**
   * The options in case `input="select"` is used.
   */
  options?: string[];

  /**
   * The id of the enum in case `input="configurable-enum-select" is used.
   */
  enumId?: string;
}
