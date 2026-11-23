import { asArray } from "../../../utils/asArray";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { splitNegation } from "./condition-negation";

/**
 * Whether the value of a row is edited as a list of options: for a multi-value field,
 * and for a field whose edit component offers several options to select (matched with `$in`).
 */
export function shouldUseMultiSelectCondition(
  fieldConfig: EntitySchemaField,
  editComponent: string,
): boolean {
  if (fieldConfig.isArray) {
    return true;
  }

  return (
    editComponent === "EditConfigurableEnum" ||
    editComponent === "EditEntity" ||
    editComponent === "EditEntityType"
  );
}

/**
 * The stored form of a row's value (in database format), depending on its field:
 * array fields match with `$elemMatch`, other dropdown fields offering multiple options with `$in`.
 *
 * @param conditionFieldConfig the field as the value is edited (see {@link shouldUseMultiSelectCondition})
 */
export function wrapConditionValue(
  fieldConfig: EntitySchemaField,
  conditionFieldConfig: EntitySchemaField,
  value: any,
): any {
  if (!Array.isArray(value) || value.length === 0) {
    return value;
  }
  if (fieldConfig.isArray) {
    return { $elemMatch: { $in: value } };
  }
  return conditionFieldConfig.isArray ? { $in: value } : value;
}

/** The value (in database format) that a row's stored condition holds, the reverse of {@link wrapConditionValue}. */
export function unwrapConditionValue(
  conditionValue: any,
  fieldConfig: EntitySchemaField,
): any {
  // a negated condition still edits the value inside it
  const { positive } = splitNegation(conditionValue);
  const elemMatch = positive?.$elemMatch;

  if (fieldConfig.isArray && elemMatch?.$in) {
    return elemMatch.$in;
  }
  if (fieldConfig.isArray && elemMatch !== undefined) {
    // legacy format of an array condition: { $elemMatch: "id" }
    return asArray(elemMatch);
  }
  if (!fieldConfig.isArray && positive?.$in) {
    return positive.$in;
  }
  // a negated plain value is stored as $eq, which the value control cannot render
  if (positive?.$eq !== undefined) {
    return positive.$eq;
  }
  return positive;
}
