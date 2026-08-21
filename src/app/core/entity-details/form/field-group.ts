import { ColumnConfig } from "../../common-components/entity-form/FormConfig";
import { TranslatableText } from "../../config/multi-lingual-config";

/**
 * A group of related form fields displayed within a Form component.
 */
export interface FieldGroup {
  /** may be configured per language; resolved before it is rendered */
  header?: TranslatableText;
  fields: ColumnConfig[];
}
