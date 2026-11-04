import { inject, Injectable } from "@angular/core";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { Entity } from "../entity/model/entity";
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
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { EntitySchema } from "../entity/schema/entity-schema";
import { toStoredFormatCondition, toStoredFormatRecord } from "./stored-format";
import { getSchemaEmbedDatatype } from "../entity/schema/embedded-schema-field.util";
import { asArray } from "../../utils/asArray";
import { Logging } from "../logging/logging.service";

/**
 * Utility service to help handling and aligning filters with entities.
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
   * Builds a predicate for a given filter object.
   * This predicate can be used to filter arrays of objects.
   * ```javascript
   * const predicate = this.filterService.getFilterPredicate(filterObj);
   * const filtered = this.data.filter(predicate)
   * ```
   *
   * Records are matched in the stored format, like the database matches them
   * (see the README of the filter module).
   *
   * @param filter a valid filter object, e.g. as provided by the `FilterComponent`
   * @throws if the filter cannot be parsed
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
    if (cached && record._rev && cached.rev === record._rev) {
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
   * Patches an entity with values required to pass the filter query.
   * This patch happens in-place.
   *
   * Only conditions requiring one specific value are applied, like `{ category: "A" }`, `{ category: { $in: ["A"] } }`
   * or `{ tags: { $elemMatch: { $eq: "A" } } }` (only for a multi-value field), every branch of `$or` and `$and`.
   * A condition on an entry of an embedded field (like `{ attendance: { $elemMatch: { participant: "Child:1" } } }`)
   * adds such an entry. The values are converted from the stored format through the datatype of the field.
   *
   * @param entity the entity to be patched
   * @param filter the filter which the entity should pass afterward
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
        this.alignEmbeddedValue(entity, field, fieldId, {
          [innerPath.join(".")]: storedCondition,
        });
      } else if (container && isPlainObject(storedCondition?.["$elemMatch"])) {
        this.alignEmbeddedValue(
          entity,
          field,
          fieldId,
          storedCondition["$elemMatch"],
        );
      } else if (innerPath.length === 0) {
        const value = toStoredValue(
          requiredValue(storedCondition, field.isArray),
          field,
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
   * Add the values required by the conditions on the inner properties of an embedded field
   * (as an entry of a list of embedded objects, or into a single embedded object).
   */
  private alignEmbeddedValue(
    entity: Entity,
    field: EntitySchemaField,
    fieldId: string,
    innerConditions: object,
  ) {
    const container = getSchemaEmbedDatatype(this.schemaService, field);
    const innerSchema = container.getEffectiveSchema(field);
    // the conditions use the paths of the inner properties in the stored value (e.g. "0" in a tuple)
    const innerFieldOfPath = new Map(
      [...innerSchema.entries()].map(([innerId, innerField]) => [
        container.getEmbeddedFieldDbPath(innerId),
        innerField,
      ]),
    );

    const storedEntry: object = Object.keys(innerConditions).some((p) =>
      /^\d/.test(p),
    )
      ? []
      : {};
    // an entry stored with nested parts (like the tuple of an old attendance field) needs all of them
    for (const innerPath of innerFieldOfPath.keys()) {
      parentOfPath(storedEntry, innerPath);
    }
    let hasValue = false;
    for (const [innerPath, innerCondition] of Object.entries(innerConditions)) {
      const innerField = innerFieldOfPath.get(innerPath);
      const value = toStoredValue(
        requiredValue(innerCondition, innerField?.isArray),
        innerField,
      );
      if (value !== undefined) {
        parentOfPath(storedEntry, innerPath)[innerPath.split(".").at(-1)] =
          value;
        hasValue = true;
      }
    }
    if (!hasValue) {
      return;
    }

    if (container.holdsArray(field)) {
      const [newEntry] = asArray(
        this.schemaService.valueToEntityFormat([storedEntry], field, entity),
      );
      entity[fieldId] = [...asArray(entity[fieldId] ?? []), newEntry];
    } else {
      entity[fieldId] = {
        ...(entity[fieldId] ?? {}),
        ...this.schemaService.valueToEntityFormat(storedEntry, field, entity),
      };
    }
  }
}

/**
 * The one value a condition requires, or `undefined` if it allows several or none:
 * a plain value, `$eq` or a single option of `$in`;
 * for a multi-value field also these inside `$elemMatch`, for which a single-value field requires nothing.
 * An empty value (of a "not defined" condition) or a list is not one value to set.
 */
function requiredValue(condition: unknown, isArrayField: boolean): unknown {
  if (!isPlainObject(condition)) {
    return condition === null || condition === "" || Array.isArray(condition)
      ? undefined
      : condition;
  }
  if ("$eq" in condition) {
    return requiredValue(condition["$eq"], false);
  }
  if (Array.isArray(condition["$in"]) && condition["$in"].length === 1) {
    return requiredValue(condition["$in"][0], false);
  }
  if (isArrayField && isPlainObject(condition["$elemMatch"])) {
    return requiredValue(condition["$elemMatch"], false);
  }
  return undefined;
}

/**
 * The value in the stored format of the field: a day ("YYYY-MM-DD") required for a `date` field (a timestamp)
 * is the start of that day in local time, like the matching compares it.
 */
function toStoredValue(
  value: unknown,
  field: EntitySchemaField | undefined,
): unknown {
  if (field?.dataType !== "date" || typeof value !== "string") {
    return value;
  }
  const day = moment(value, "YYYY-MM-DD", true);
  return day.isValid() ? day.toISOString() : value;
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
