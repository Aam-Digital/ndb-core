import moment from "moment";
import { Entity } from "../entity/model/entity";
import { EntitySchema } from "../entity/schema/entity-schema";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { getSchemaEmbedDatatype } from "../entity/schema/embedded-schema-field.util";
import { SchemaEmbedDatatype } from "../basic-datatypes/schema-embed/schema-embed.datatype";
import { isPlainObject } from "../../utils/filter-compare-utils";
import { DataFilter } from "./filters/filters";
import { DefaultDatatype } from "../entity/default-datatype/default.datatype";

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
export function toStoredFormatCondition<T>(
  condition: DataFilter<T>,
  schema: EntitySchema | undefined,
  schemaService: EntitySchemaService,
  inMemory = false,
): DataFilter<T> {
  return toStoredSelector(
    condition,
    { schema, inMemory },
    schemaService,
  ) as DataFilter<T>;
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
  return withEntityProperties(
    schemaService.transformEntityToDatabaseFormat(entity),
    entity,
    entity.getSchema(),
  );
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

function toStoredSelector(
  query: unknown,
  ctx: SchemaContext,
  schemaService: EntitySchemaService,
): unknown {
  if (Array.isArray(query)) {
    return query.map((q) => toStoredSelector(q, ctx, schemaService));
  }
  if (!isPlainObject(query)) {
    return query;
  }

  const result = {};
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith("$")) {
      result[key] = toStoredSelector(value, ctx, schemaService);
      continue;
    }
    const { storedPath, field } = toStoredPath(key, ctx, schemaService);
    const condition = toStoredOperators(value, field, schemaService);
    // pouchdb-find skips implicit equality with a falsy value (e.g. `{status: ""}`)
    // inside `$elemMatch` and matches every entry, an explicit `$eq` works on both engines
    result[storedPath] =
      ctx.inElemMatch && !isPlainObject(condition)
        ? { $eq: condition }
        : condition;
  }
  return result;
}

/**
 * Translate a (dotted) field path into its path in the stored format:
 * enum and entity references are stored as the plain id, so e.g.
 * "gender.id" becomes "gender" and "phoneNumber.type.id" becomes "phoneNumber.type".
 * Only for fields that are actually stored that way, though - on any other
 * field ".id" is a real path into an object value.
 */
function toStoredPath(
  key: string,
  ctx: SchemaContext,
  schemaService: EntitySchemaService,
): { storedPath: string; field?: EntitySchemaField } {
  if (ctx.inMemory && isPathIntoEntityValue(key, ctx.schema, schemaService)) {
    return { storedPath: `${ENTITY_VALUES_KEY}.${key}` };
  }

  const storedSegments: string[] = [];
  let current = ctx;
  let field: EntitySchemaField | undefined;
  for (const segment of key.split(".")) {
    if (
      segment === "id" &&
      datatypeOf(field, schemaService).storedFormat === "id"
    ) {
      continue;
    }
    storedSegments.push(
      current.container?.getEmbeddedFieldDbPath(segment) ?? segment,
    );
    field = current.schema?.get(segment);
    current = getEmbeddedContext(field, schemaService);
  }
  return { storedPath: storedSegments.join("."), field };
}

function toStoredOperators(
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
      result[operator] = toStoredSelector(
        value,
        { ...getEmbeddedContext(field, schemaService), inElemMatch: true },
        schemaService,
      );
    } else if (operator === "$not") {
      result[operator] = toStoredOperators(value, field, schemaService);
    } else {
      result[operator] = toStoredBound(operator, value, field, schemaService);
    }
  }
  return result;
}

/** whether the path leads into a value that is an object only in the entity, like `dateOfBirth.age` (but not `gender.id`) */
function isPathIntoEntityValue(
  key: string,
  schema: EntitySchema | undefined,
  schemaService: EntitySchemaService,
): boolean {
  const [fieldId, ...path] = key.split(".");
  const { storedFormat } = datatypeOf(schema?.get(fieldId), schemaService);
  if (path.length === 0 || storedFormat === "as-is") {
    return false;
  }
  return !(path.length === 1 && path[0] === "id" && storedFormat === "id");
}

function datatypeOf(
  field: EntitySchemaField | undefined,
  schemaService: EntitySchemaService,
): DefaultDatatype {
  return schemaService.getDatatypeOrDefault(field?.dataType);
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
 * For a field stored in another format, the field's datatype rewrites the day into that format (see `toStoredDayBound`).
 */
function toStoredBound(
  operator: string,
  value: unknown,
  field: EntitySchemaField | undefined,
  schemaService: EntitySchemaService,
): unknown {
  if (
    !["$gte", "$gt", "$lte", "$lt"].includes(operator) ||
    typeof value !== "string" ||
    !moment(value, "YYYY-MM-DD", true).isValid()
  ) {
    return value;
  }
  // `$lte` and `$gt` compare with the end of the day, `$gte` and `$lt` with its start
  const atEndOfDay = operator === "$lte" || operator === "$gt";
  return datatypeOf(field, schemaService).toStoredDayBound(value, atEndOfDay);
}
