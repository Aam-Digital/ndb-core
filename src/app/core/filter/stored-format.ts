import moment from "moment";
import { Entity } from "../entity/model/entity";
import { EntitySchema } from "../entity/schema/entity-schema";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { getSchemaEmbedDatatype } from "../entity/schema/embedded-schema-field.util";
import { SchemaEmbedDatatype } from "../basic-datatypes/schema-embed/schema-embed.datatype";
import { isPlainObject } from "../../utils/filter-compare-utils";

/** datatypes whose value is stored as the referenced id alone */
const STORED_BY_ID_DATATYPES = ["configurable-enum", "entity"];

/**
 * datatypes whose value is an object in the entity (like a `Date` or a dropdown option)
 * but a plain value (like a string) in the stored format, so that a path into the value only exists in the entity
 */
const PLAIN_STORED_DATATYPES = [
  ...STORED_BY_ID_DATATYPES,
  "date",
  "date-only",
  "date-with-age",
  "month",
];

/**
 * Key under which a record in the stored format (see {@link toStoredFormatRecord}) gives access to the entity itself,
 * for conditions on values that only the entity has (like the `age` of a date of birth).
 */
const ENTITY_VALUES_KEY = "__entity__";

/**
 * Normalize a condition so that it matches records in the stored format,
 * the format that the database and the in-memory matching both evaluate:
 * - old keys addressing the object of a dropdown option or a linked record (e.g. "gender.id") become the stored id path ("gender"),
 * - the properties of embedded fields get their path in the stored value (e.g. the index in the tuples of an old attendance field),
 * - days compared with a `date` or `month` field are rewritten into the stored format of that field.
 *
 * The schema is walked alongside the condition, so that fields nested inside
 * embedded fields (in `$elemMatch` or as dotted paths) are resolved as well.
 *
 * @param inMemory whether the condition is matched in memory against a record from {@link toStoredFormatRecord},
 *   which also gives access to values that only the entity has (like `dateOfBirth.age`)
 */
export function toStoredFormatCondition(
  condition: unknown,
  schema: EntitySchema | undefined,
  schemaService: EntitySchemaService,
  inMemory = false,
): any {
  return toDbSelector(condition, { schema, inMemory }, schemaService);
}

/**
 * The record as the database stores it, to match conditions in the stored format in memory:
 * its schema fields have their stored values, any other property (like a value calculated by the entity class)
 * is read from the entity itself.
 *
 * @throws if a value cannot be converted
 */
export function toStoredFormatRecord(
  entity: Entity,
  schemaService: EntitySchemaService,
): object {
  const schema = entity.getSchema();
  const stored = {};
  for (const [key, field] of schema) {
    const value = entity[key];
    if (value === undefined) {
      continue;
    }
    // a value saved while the field allowed several values stays a list, like in the database
    const storedAs =
      Array.isArray(value) &&
      !field.isArray &&
      STORED_BY_ID_DATATYPES.includes(field.dataType)
        ? { ...field, isArray: true }
        : field;
    const storedValue = schemaService.valueToDatabaseFormat(
      value,
      storedAs,
      entity,
    );
    if (storedValue !== undefined) {
      stored[key] = storedValue;
    }
  }
  return withEntityProperties(stored, entity, schema);
}

/**
 * The stored values of a record, extended by the properties of the entity that are not stored
 * (like the getters of the entity class), which are read from the entity itself.
 * The stored values are the record's own properties (as checked by `$exists`); a schema field without stored value is missing.
 */
function withEntityProperties(
  stored: object,
  entity: Entity,
  schema: EntitySchema,
): object {
  const isEntityProperty = (key: string | symbol) =>
    !Object.hasOwn(stored, key) && !schema.has(key as string);
  return new Proxy(stored, {
    get: (target, key) => {
      if (key === ENTITY_VALUES_KEY) {
        return entity;
      }
      return isEntityProperty(key) ? entity[key] : target[key];
    },
    has: (target, key) =>
      key in target || (isEntityProperty(key) && key in entity),
    getOwnPropertyDescriptor: (target, key) => {
      const descriptor = isEntityProperty(key)
        ? Object.getOwnPropertyDescriptor(entity, key)
        : Object.getOwnPropertyDescriptor(target, key);
      // a property reported in addition to those of the target has to be configurable
      return descriptor && { ...descriptor, configurable: true };
    },
  });
}

function toDbSelector(
  query: unknown,
  ctx: SchemaContext,
  schemaService: EntitySchemaService,
): any {
  if (Array.isArray(query)) {
    return query.map((q) => toDbSelector(q, ctx, schemaService));
  }
  if (!isPlainObject(query)) {
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
      ctx.inElemMatch && !isPlainObject(condition)
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
  if (ctx.inMemory && isPathIntoEntityValue(key, ctx.schema)) {
    return { dbPath: `${ENTITY_VALUES_KEY}.${key}` };
  }

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
  if (!isPlainObject(condition)) {
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

/** whether the path leads into a value that is an object only in the entity, like `dateOfBirth.age` (but not `gender.id`) */
function isPathIntoEntityValue(
  key: string,
  schema: EntitySchema | undefined,
): boolean {
  const [fieldId, ...path] = key.split(".");
  const field = schema?.get(fieldId);
  if (path.length === 0 || !PLAIN_STORED_DATATYPES.includes(field?.dataType)) {
    return false;
  }
  return !(
    path.length === 1 &&
    path[0] === "id" &&
    STORED_BY_ID_DATATYPES.includes(field.dataType)
  );
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
  /** Whether the condition is matched in memory, see {@link toStoredFormatCondition}. */
  inMemory?: boolean;
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
