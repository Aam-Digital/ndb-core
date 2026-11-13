import { inject, Injectable } from "@angular/core";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { Entity, EntityConstructor } from "../entity/model/entity";
import {
  combineFilterConditions,
  DataFilter,
  Filter as EntityFilter,
} from "./filters/filters";
import {
  createFilterPredicate,
  isPlainObject,
} from "../../utils/filter-compare-utils";
import moment from "moment";
import { isEqual } from "lodash-es";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { EntitySchema } from "../entity/schema/entity-schema";
import { toStoredFormatCondition, toStoredFormatRecord } from "./stored-format";
import {
  getEmbeddedFieldId,
  getEmbeddedFieldLabel,
  getEmbeddedFieldRefs,
  getSchemaEmbedDatatype,
  resolveEmbeddedField,
} from "../entity/schema/embedded-schema-field.util";
import { conditionOnEmbeddedField } from "./embedded-field-filter";
import { FormFieldConfig } from "../common-components/entity-form/FormConfig";
import { asArray } from "../../utils/asArray";
import { Logging } from "../logging/logging.service";
import { SchemaEmbedDatatype } from "../basic-datatypes/schema-embed/schema-embed.datatype";

/**
 * Works with conditions on records: matches records in memory, offers the fields a condition can be set on,
 * and pre-fills a new record so that it matches a condition.
 */
@Injectable({
  providedIn: "root",
})
export class FilterService {
  private readonly schemaService = inject(EntitySchemaService);

  /** the records in the stored format, kept per saved revision (see {@link toStoredFormat}) */
  private readonly storedFormatCache = new WeakMap<
    Entity,
    { rev: string; record: object }
  >();

  /**
   * The fields of the entity type that a condition can be set on, for a field select:
   * its own fields and, instead of an embedded field itself, the properties of its entries
   * (with paths like "attendance.status"), as `options` in addition to the record's fields and the `excludedFields`.
   *
   * @param onStoredDocuments the conditions are matched against the stored documents (e.g. permissions, notification rules):
   *    an embedded field whose entries are stored in another shape (like the tuples of an old attendance field) is then kept whole
   */
  getConditionFields(
    entityType: EntityConstructor,
    onStoredDocuments = false,
  ): {
    options: FormFieldConfig[];
    excludedFields: string[];
  } {
    const embeddedRefs = getEmbeddedFieldRefs(
      this.schemaService,
      entityType,
    ).filter(
      ({ outerSchema, innerProp }) =>
        // like the field select does for the record's own fields
        !outerSchema.isInternalField &&
        !!outerSchema.label &&
        (!onStoredDocuments ||
          getSchemaEmbedDatatype(
            this.schemaService,
            outerSchema,
          ).getEmbeddedFieldDbPath(innerProp) === innerProp),
    );
    return {
      options: embeddedRefs.map((ref) => ({
        ...ref.innerSchema,
        id: getEmbeddedFieldId(ref),
        label: getEmbeddedFieldLabel(ref),
      })),
      excludedFields: [...new Set(embeddedRefs.map((ref) => ref.outerProp))],
    };
  }

  /** The schema of the field at the path (see {@link getConditionFields}). */
  getFieldAtPath(
    entityType: EntityConstructor,
    fieldPath: string,
  ): EntitySchemaField | undefined {
    return (
      entityType.schema.get(fieldPath) ??
      resolveEmbeddedField(this.schemaService, entityType, fieldPath)
        ?.innerSchema
    );
  }

  /**
   * A condition on a field path (see {@link getConditionFields}) as it is stored:
   * one on a property of an embedded field is a condition on one of its entries
   * (e.g. `{ "attendance.status": "A" }` becomes `{ attendance: { $elemMatch: { status: "A" } } }`).
   */
  toStoredCondition<T extends Entity>(
    entityType: EntityConstructor,
    condition: DataFilter<T>,
  ): DataFilter<T> {
    const [fieldPath] = Object.keys(condition ?? {});
    const embedded =
      fieldPath &&
      resolveEmbeddedField(this.schemaService, entityType, fieldPath);
    return embedded
      ? conditionOnEmbeddedField(condition, fieldPath, embedded)
      : condition;
  }

  /** The reverse of {@link toStoredCondition}: a condition on one entry of an embedded field becomes one on the path of the property. */
  fromStoredCondition<T extends Entity>(
    entityType: EntityConstructor,
    condition: DataFilter<T>,
  ): DataFilter<T> {
    const [fieldId] = Object.keys(condition ?? {});
    const entryCondition = condition?.[fieldId]?.$elemMatch;
    const innerKeys = isPlainObject(entryCondition)
      ? Object.keys(entryCondition)
      : [];
    if (innerKeys.length !== 1 || innerKeys[0].startsWith("$")) {
      return condition;
    }
    const fieldPath = `${fieldId}.${innerKeys[0]}`;
    return resolveEmbeddedField(this.schemaService, entityType, fieldPath)
      ? ({ [fieldPath]: entryCondition[innerKeys[0]] } as DataFilter<T>)
      : condition;
  }

  combineFilters<T extends Entity>(
    entityFilters: EntityFilter<T>[],
  ): DataFilter<T> {
    return combineFilterConditions<T>(
      ...entityFilters.map((value: EntityFilter<T>): DataFilter<T> =>
        value.getFilter(),
      ),
    );
  }

  /**
   * A function telling whether a record matches the condition, e.g. to filter a list of records.
   * Records are matched in the stored format, like the database matches them
   * (see the README of the filter module).
   *
   * @throws if the condition cannot be parsed
   */
  getFilterPredicate<T extends Entity>(
    filter: DataFilter<T>,
  ): (record: T) => boolean {
    const matchesAsIs = createFilterPredicate<T>(filter);
    const matchesPerSchema = new Map<
      EntitySchema,
      (record: object) => boolean
    >();
    return (record: T) => {
      if (!(record instanceof Entity)) {
        return matchesAsIs(record);
      }
      const schema = record.getSchema();
      let matches = matchesPerSchema.get(schema);
      if (!matches) {
        matches = createFilterPredicate(
          toStoredFormatCondition(filter, schema, this.schemaService, true),
        );
        matchesPerSchema.set(schema, matches);
      }
      return matches(this.toStoredFormat(record));
    };
  }

  /**
   * The record as the database stores it (see {@link toStoredFormatRecord}).
   *
   * Saved records are converted once per revision. A record without revision (e.g. a new record) is converted every time,
   * as it may still change. A copy with unsaved changes (like the current state of a form) is a new object and converted anew.
   */
  private toStoredFormat(record: Entity): object {
    const cached = this.storedFormatCache.get(record);
    if (record._rev && cached?.rev === record._rev) {
      return cached.record;
    }

    let storedRecord: object;
    try {
      storedRecord = toStoredFormatRecord(record, this.schemaService);
    } catch (err) {
      // a value that cannot be converted is a data problem of this record, not a reason to fail the whole list
      Logging.debug(
        "[FILTER] could not convert record to the stored format",
        err,
      );
      return record;
    }
    if (record._rev) {
      this.storedFormatCache.set(record, {
        rev: record._rev,
        record: storedRecord,
      });
    }
    return storedRecord;
  }

  /**
   * Set the values the condition requires on the entity (in place), so that it matches the condition afterwards.
   *
   * Only conditions requiring one specific value are applied, like `{ category: "A" }`, `{ category: { $in: ["A"] } }`
   * or `{ tags: { $elemMatch: { $eq: "A" } } }` (only for a multi-value field), every branch of `$or` and `$and`.
   * A condition on an entry of an embedded field (like `{ attendance: { $elemMatch: { participant: "Child:1" } } }`)
   * adds such an entry. The values are converted from the stored format through the datatype of the field.
   */
  alignEntityWithFilter<T extends Entity>(entity: T, filter: DataFilter<T>) {
    const schema = entity.getSchema();
    for (const [key, condition] of Object.entries(filter ?? {})) {
      if ((key === "$or" || key === "$and") && Array.isArray(condition)) {
        // apply each branch of the alternatives ($or) or required parts ($and)
        for (const branch of condition) {
          this.alignEntityWithFilter(entity, branch);
        }
        continue;
      }

      const [path, storedCondition] = Object.entries(
        toStoredFormatCondition(
          { [key]: condition },
          schema,
          this.schemaService,
        ),
      )[0];
      const [fieldId, ...innerPath] = path.split(".");
      const field = schema.get(fieldId);
      if (!field) {
        continue;
      }

      const container = getSchemaEmbedDatatype(this.schemaService, field);
      if (container && innerPath.length > 0) {
        // a single embedded object, e.g. { "phone.type": "mobile" }
        this.addEmbeddedEntry(entity, fieldId, field, container, {
          [innerPath.join(".")]: storedCondition,
        });
      } else if (container && isPlainObject(storedCondition?.["$elemMatch"])) {
        this.addEmbeddedEntry(
          entity,
          fieldId,
          field,
          container,
          storedCondition["$elemMatch"],
        );
      } else if (innerPath.length === 0) {
        const value = requiredStoredValue(
          storedCondition,
          field,
          this.schemaService,
        );
        if (value !== undefined) {
          entity[fieldId] = this.schemaService.valueToEntityFormat(
            field.isArray ? [value] : value,
            field,
            entity,
          );
        }
      }
    }
  }

  /**
   * Add the entry required by the conditions on the inner properties of an embedded field
   * to its list of entries, or into its single embedded object.
   */
  private addEmbeddedEntry(
    entity: Entity,
    fieldId: string,
    field: EntitySchemaField,
    container: SchemaEmbedDatatype,
    innerConditions: object,
  ) {
    const storedEntry = requiredEntry(
      container,
      field,
      innerConditions,
      this.schemaService,
    );
    if (!storedEntry) {
      return;
    }

    if (container.holdsArray(field)) {
      const entries = asArray(entity[fieldId] ?? []);
      const [newEntry] = asArray(
        this.schemaService.valueToEntityFormat([storedEntry], field, entity),
      );
      // the alternatives of a condition (like the shapes a field may be stored in) can require the same entry
      if (!entries.some((entry) => isEqual(entry, newEntry))) {
        entity[fieldId] = [...entries, newEntry];
      }
    } else {
      entity[fieldId] = {
        ...(entity[fieldId] ?? {}),
        ...this.schemaService.valueToEntityFormat(storedEntry, field, entity),
      };
    }
  }
}

/**
 * The entry of an embedded field, in the stored format, with the values required by the conditions on its inner properties,
 * or `undefined` if they require none.
 */
function requiredEntry(
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
function requiredStoredValue(
  condition: unknown,
  field: EntitySchemaField | undefined,
  schemaService: EntitySchemaService,
  ofList = field?.isArray,
): unknown {
  if (isPlainObject(condition)) {
    if ("$eq" in condition) {
      return requiredStoredValue(condition["$eq"], field, schemaService, false);
    }
    if (Array.isArray(condition["$in"]) && condition["$in"].length === 1) {
      return requiredStoredValue(
        condition["$in"][0],
        field,
        schemaService,
        false,
      );
    }
    if (ofList && isPlainObject(condition["$elemMatch"])) {
      return requiredStoredValue(
        condition["$elemMatch"],
        field,
        schemaService,
        false,
      );
    }
    return undefined;
  }
  if (condition === null || condition === "" || Array.isArray(condition)) {
    return undefined;
  }

  // a day ("YYYY-MM-DD") becomes a value of the field's datatype (e.g. the timestamp of a date)
  return typeof condition === "string" &&
    moment(condition, "YYYY-MM-DD", true).isValid()
    ? schemaService.getDatatypeOrDefault(field?.dataType).toStoredDay(condition)
    : condition;
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
