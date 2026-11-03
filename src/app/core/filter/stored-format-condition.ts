import moment from "moment";
import { EntitySchema } from "../entity/schema/entity-schema";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { getSchemaEmbedDatatype } from "../entity/schema/embedded-schema-field.util";
import { SchemaEmbedDatatype } from "../basic-datatypes/schema-embed/schema-embed.datatype";

/** datatypes whose value is stored as the referenced id alone */
const STORED_BY_ID_DATATYPES = ["configurable-enum", "entity"];

/**
 * Normalize a condition so that it matches records in the stored format,
 * the format that the database and the in-memory matching both evaluate:
 * - old keys addressing the object of a dropdown option or a linked record (e.g. "gender.id") become the stored id path ("gender"),
 * - the properties of embedded fields get their path in the stored value (e.g. the index in the tuples of an old attendance field),
 * - days compared with a `date` or `month` field are rewritten into the stored format of that field.
 *
 * The schema is walked alongside the condition, so that fields nested inside
 * embedded fields (in `$elemMatch` or as dotted paths) are resolved as well.
 */
export function toStoredFormatCondition(
  condition: unknown,
  schema: EntitySchema | undefined,
  schemaService: EntitySchemaService,
): any {
  return toDbSelector(condition, { schema }, schemaService);
}

function toDbSelector(
  query: unknown,
  ctx: SchemaContext,
  schemaService: EntitySchemaService,
): any {
  if (Array.isArray(query)) {
    return query.map((q) => toDbSelector(q, ctx, schemaService));
  }
  if (!query || typeof query !== "object") {
    return query;
  }

  const result = {};
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith("$")) {
      result[key] = toDbSelector(value, ctx, schemaService);
      continue;
    }
    const { dbPath, field } = toDbPath(key, ctx, schemaService);
    const condition = toDbCondition(value, field, schemaService);
    // pouchdb-find skips implicit equality with a falsy value (e.g. `{status: ""}`)
    // inside `$elemMatch` and matches every entry, an explicit `$eq` works on both engines
    result[dbPath] =
      ctx.inElemMatch && !isOperatorObject(condition)
        ? { $eq: condition }
        : condition;
  }
  return result;
}

/**
 * Translate a (dotted) field path into its path in the database format:
 * enum and entity references are stored as the plain id, so e.g.
 * "gender.id" becomes "gender" and "phoneNumber.type.id" becomes "phoneNumber.type".
 * Only for fields that are actually stored that way, though - on any other
 * field ".id" is a real path into an object value.
 */
function toDbPath(
  key: string,
  ctx: SchemaContext,
  schemaService: EntitySchemaService,
): { dbPath: string; field?: EntitySchemaField } {
  const dbSegments: string[] = [];
  let current = ctx;
  let field: EntitySchemaField | undefined;
  for (const segment of key.split(".")) {
    if (segment === "id" && STORED_BY_ID_DATATYPES.includes(field?.dataType)) {
      continue;
    }
    dbSegments.push(
      current.container?.getEmbeddedFieldDbPath(segment) ?? segment,
    );
    field = current.schema?.get(segment);
    current = getEmbeddedContext(field, schemaService);
  }
  return { dbPath: dbSegments.join("."), field };
}

function toDbCondition(
  condition: unknown,
  field: EntitySchemaField | undefined,
  schemaService: EntitySchemaService,
): unknown {
  if (condition === undefined) {
    // `undefined` cannot be sent in a Mango query, and dropping the key
    // would leave an empty selector that matches every document
    return { $exists: false };
  }
  if (!isOperatorObject(condition)) {
    return condition;
  }

  const result = {};
  for (const [operator, value] of Object.entries(condition)) {
    if (operator === "$elemMatch") {
      result[operator] = toDbSelector(
        value,
        { ...getEmbeddedContext(field, schemaService), inElemMatch: true },
        schemaService,
      );
    } else if (operator === "$not") {
      result[operator] = toDbCondition(value, field, schemaService);
    } else {
      result[operator] = toStoredDateBound(operator, value, field?.dataType);
    }
  }
  return result;
}

function getEmbeddedContext(
  field: EntitySchemaField | undefined,
  schemaService: EntitySchemaService,
): SchemaContext {
  const container = getSchemaEmbedDatatype(schemaService, field);
  return { schema: container?.getEffectiveSchema(field), container };
}

/** The schema that the keys of a (nested) query object refer to. */
interface SchemaContext {
  schema?: EntitySchema;
  /** The datatype of the embedded field whose inner fields the keys refer to, which knows their paths in the stored value. */
  container?: SchemaEmbedDatatype;
  /** Whether the keys are the conditions on an array entry inside `$elemMatch`. */
  inElemMatch?: boolean;
}

function isOperatorObject(condition: unknown): condition is object {
  return (
    !!condition && typeof condition === "object" && !Array.isArray(condition)
  );
}

/**
 * Date filters compare with a day ("YYYY-MM-DD"), which records in memory match at day precision.
 * For a field stored in another format, rewrite the day into that format, keeping this meaning:
 * a "date" is a UTC timestamp, so the day becomes its first or last moment in local time;
 * a "month" is "YYYY-MM" and counts as its first day.
 */
function toStoredDateBound(
  operator: string,
  value: unknown,
  dataType: string | undefined,
): unknown {
  if (
    (dataType !== "date" && dataType !== "month") ||
    !["$gte", "$gt", "$lte", "$lt"].includes(operator) ||
    typeof value !== "string"
  ) {
    return value;
  }
  const day = moment(value, "YYYY-MM-DD", true);
  if (!day.isValid()) {
    return value;
  }

  // `$lte` and `$gt` compare with the end of the day, `$gte` and `$lt` with its start
  const atEndOfDay = operator === "$lte" || operator === "$gt";
  if (dataType === "date") {
    if (atEndOfDay) {
      return day.endOf("day").toISOString();
    }
    // a date stored without time ("YYYY-MM-DD") counts as midnight UTC but sorts right before that timestamp,
    // so where the day starts at midnight UTC, only the day itself as bound treats it like in memory
    const startOfDay = day.startOf("day").toISOString();
    return startOfDay === `${value}T00:00:00.000Z` ? value : startOfDay;
  }
  return (atEndOfDay || day.date() === 1 ? day : day.add(1, "month")).format(
    "YYYY-MM",
  );
}
