import { PanelConfig } from "../EntityDetailsConfig";

export class FormConfig extends PanelConfig {
  cols: FormFieldConfig[][];
}

export class FormFieldConfig {
  input: string;
  id: string;
  placeholder: string;
  required: boolean = false;
  options?: string[];
}
