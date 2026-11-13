import moment from "moment";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { SchemaEmbedDatatype } from "../basic-datatypes/schema-embed/schema-embed.datatype";
import { isPlainObject } from "../../utils/filter-compare-utils";

/**
 * The entry of an embedded field, in the stored format, with the values required by the conditions on its inner properties,
 * or `undefined` if they require none.
 */
export function requiredEntry(
  container: SchemaEmbedDatatype,
  field: EntitySchemaField,
  innerConditions: object,
  schemaService: EntitySchemaService,
): object | undefined {
  // the conditions use the paths of the inner properties in the stored value (e.g. "0" in a tuple)
  const innerFieldOfPath = new Map(
    [...container.getEffectiveSchema(field)].map(([innerId, innerField]) => [
      container.getEmbeddedFieldDbPath(innerId),
      innerField,
    ]),
  );

  const entry: object = Object.keys(innerConditions).some((p) => /^\d/.test(p))
    ? []
    : {};
  // an entry stored with nested parts (like the tuple of an old attendance field) needs all of them
  for (const innerPath of innerFieldOfPath.keys()) {
    parentOfPath(entry, innerPath);
  }
  let hasValue = false;
  for (const [innerPath, innerCondition] of Object.entries(innerConditions)) {
    const value = requiredStoredValue(
      innerCondition,
      innerFieldOfPath.get(innerPath),
      schemaService,
    );
    if (value !== undefined) {
      parentOfPath(entry, innerPath)[innerPath.split(".").at(-1)] = value;
      hasValue = true;
    }
  }
  return hasValue ? entry : undefined;
}

/**
 * The one value a condition requires, in the stored format of the field, or `undefined` if it allows several or none:
 * a plain value, `$eq` or a single option of `$in`; for a multi-value field also these inside `$elemMatch`.
 * An empty value (of a "not defined" condition) or a list is not one value to set.
 *
 * @param ofList whether the condition is on the list of a multi-value field, of which `$elemMatch` addresses one value
 */
export function requiredStoredValue(
  condition: unknown,
  field: EntitySchemaField | undefined,
  schemaService: EntitySchemaService,
  ofList = field?.isArray,
): unknown {
  if (isPlainObject(condition)) {
    const operand = requiredOperand(condition, ofList);
    return (
      operand && requiredStoredValue(operand.value, field, schemaService, false)
    );
  }
  if (condition === null || condition === "" || Array.isArray(condition)) {
    return undefined;
  }

  // a day ("YYYY-MM-DD") becomes a value of the field's datatype (e.g. the timestamp of a date)
  return isDay(condition)
    ? schemaService.getDatatypeOrDefault(field?.dataType).toStoredDay(condition)
    : condition;
}

/** the operand of the operator requiring one specific value: `$eq`, a single option of `$in`, or `$elemMatch` on a list */
function requiredOperand(
  condition: Record<string, unknown>,
  ofList: boolean,
): { value: unknown } | undefined {
  if ("$eq" in condition) {
    return { value: condition["$eq"] };
  }
  if (Array.isArray(condition["$in"]) && condition["$in"].length === 1) {
    return { value: condition["$in"][0] };
  }
  return ofList && isPlainObject(condition["$elemMatch"])
    ? { value: condition["$elemMatch"] }
    : undefined;
}

function isDay(value: unknown): value is string {
  return (
    typeof value === "string" && moment(value, "YYYY-MM-DD", true).isValid()
  );
}

/** the object holding the last segment of the path, created where missing */
function parentOfPath(target: object, path: string): object {
  let current = target;
  for (const segment of path.split(".").slice(0, -1)) {
    current[segment] ??= {};
    current = current[segment];
  }
  return current;
}
