import { inject, Injectable } from "@angular/core";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { Entity } from "../entity/model/entity";
import moment from "moment";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import {
  combineFilterConditions,
  DataFilter,
  Filter as EntityFilter,
} from "./filters/filters";
import { createFilterPredicate } from "../../utils/filter-compare-utils";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { EntitySchema } from "../entity/schema/entity-schema";
import { toStoredFormatCondition, toStoredFormatRecord } from "./stored-format";
import { Logging } from "../logging/logging.service";

/**
 * Utility service to help handling and aligning filters with entities.
 */
@Injectable({
  providedIn: "root",
})
export class FilterService {
  private enumService = inject(ConfigurableEnumService);
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
   * @param entity the entity to be patched
   * @param filter the filter which the entity should pass afterward
   */
  alignEntityWithFilter<T extends Entity>(entity: T, filter: DataFilter<T>) {
    const schema = entity.getSchema();
    Object.entries(filter ?? {}).forEach(([key, value]) => {
      if ((key === "$or" || key === "$and") && Array.isArray(value)) {
        // apply each branch of the alternatives ($or) or required parts ($and)
        for (const branch of value) {
          this.alignEntityWithFilter(entity, branch);
        }
      } else if (typeof value !== "object") {
        // only simple equality filters are automatically applied to new entities, complex conditions (e.g. $lt / $gt) are ignored)
        this.assignValueToEntity(key, value, schema, entity);
      } else if (value["$elemMatch"]?.["$eq"]) {
        // e.g. { children: { $elemMatch: { $eq: "Child:some-id" } } }
        this.assignValueToEntity(
          key,
          value["$elemMatch"]["$eq"],
          schema,
          entity,
          true,
        );
      } else if (isSingleOptionList(value?.["$in"])) {
        // e.g. { category: { $in: ["GUARDIAN_TALK"] } } (as saved by the conditions editor)
        this.assignValueToEntity(key, value["$in"][0], schema, entity);
      } else if (isSingleOptionList(value?.["$elemMatch"]?.["$in"])) {
        this.assignValueToEntity(
          key,
          value["$elemMatch"]["$in"][0],
          schema,
          entity,
          true,
        );
      }
    });
  }

  /**
   * @param isElemMatch whether the value comes from an `$elemMatch` filter condition.
   */
  private assignValueToEntity<T extends Entity>(
    key: string,
    value,
    schema: Map<string, EntitySchemaField>,
    newEntity: T,
    isElemMatch = false,
  ) {
    if (key.includes(".")) {
      // TODO only one level deep nesting is supported (also by ucast https://github.com/stalniy/ucast/issues/32)
      [key, value] = this.transformNestedKey(key, value);
    }
    const property = schema.get(key);

    if (!property) {
      // not a schema property
      return;
    }
    if (isElemMatch && !property.isArray) {
      // Filter options (e.g. of ConfigurableEnumFilter, EntityFilter) offer a plain equality and an
      // `$elemMatch` variant side by side to also match data saved while the field had the other
      // (single / multi select) setting. Only the variant fitting the current field applies here.
      return;
    }

    if (property?.dataType === "configurable-enum") {
      value = this.parseConfigurableEnumValue(property, value);
    }
    if (property?.dataType.includes("date")) {
      value = moment(value).toDate();
    }
    newEntity[key] = property.isArray ? [value] : value;
  }

  private transformNestedKey(key: string, value): any[] {
    const [first, second] = key.split(".");
    return [first, { [second]: value }];
  }

  private parseConfigurableEnumValue(property: EntitySchemaField, value) {
    const enumValues = this.enumService.getEnumValues(property.additional);
    const valueId = typeof value === "string" ? value : value["id"];
    return enumValues.find(({ id }) => id === valueId);
  }
}

/** a list with exactly one option, which can be applied as plain value */
function isSingleOptionList(value: unknown): value is [unknown] {
  return Array.isArray(value) && value.length === 1;
}
