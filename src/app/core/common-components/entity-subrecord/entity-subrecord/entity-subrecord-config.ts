import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { MongoQuery } from "@casl/ability";

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

/**
 * This filter can be used to filter an array of entities.
 * It has to follow the MongoDB Query Syntax {@link https://www.mongodb.com/docs/manual/reference/operator/query/}.
 *
 * The filter is parsed using ucast {@link https://github.com/stalniy/ucast/tree/master/packages/mongo2js}
 */
export type DataFilter<T> = MongoQuery<T> | {};
