import { Injectable } from "@angular/core";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { DataFilter } from "../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Entity } from "../entity/model/entity";
import {
  allInterpreters,
  allParsingInstructions,
  compare,
  createFactory,
  Filter,
} from "@ucast/mongo2js";
import moment from "moment";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";

/**
 * Utility service to help handling and aligning filters with entities.
 */
@Injectable({
  providedIn: "root",
})
export class FilterService {
  private filterFactory = createFactory(
    allParsingInstructions,
    allInterpreters,
    { compare: this.extendedCompare.bind(this) },
  ) as Filter;

  constructor(private enumService: ConfigurableEnumService) {}

  /**
   * Builds a predicate for a given filter object.
   * This predicate can be used to filter arrays of objects.
   * ```javascript
   * const predicate = this.filterService.getFilterPredicate(filterObj);
   * const filtered = this.data.filter(predicate)
   * ```
   * @param filter a valid filter object, e.g. as provided by the `FilterComponent`
   */
  getFilterPredicate<T extends Entity>(filter: DataFilter<T>) {
    return this.filterFactory<T>(filter);
  }

  /**
   * Patches an entity with values required to pass the filter query.
   * This patch happens in-place.
   * @param entity the entity to be patched
   * @param filter the filter which the entity should pass afterwards
   */
  alignEntityWithFilter<T extends Entity>(entity: T, filter: DataFilter<T>) {
    const schema = entity.getSchema();
    Object.entries(filter ?? {}).forEach(([key, value]) => {
      // TODO support arrays through recursion
      if (typeof value !== "object") {
        // only simple equality filters are automatically applied to new entities, complex conditions (e.g. $lt / $gt) are ignored)
        this.assignValueToEntity(key, value, schema, entity);
      }
    });
  }

  private assignValueToEntity<T extends Entity>(
    key: string,
    value,
    schema: Map<string, EntitySchemaField>,
    newEntity: T,
  ) {
    if (key.includes(".")) {
      // TODO only one level deep nesting is supported (also by ucast https://github.com/stalniy/ucast/issues/32)
      [key, value] = this.transformNestedKey(key, value);
    }
    const property = schema.get(key);
    if (property?.dataType === "configurable-enum") {
      value = this.parseConfigurableEnumValue(property, value);
    }
    if (property?.dataType.includes("date")) {
      value = moment(value).toDate();
    }
    newEntity[key] = value;
  }

  private transformNestedKey(key: string, value): any[] {
    const [first, second] = key.split(".");
    return [first, { [second]: value }];
  }

  private parseConfigurableEnumValue(property: EntitySchemaField, value) {
    const enumValues = this.enumService.getEnumValues(
      property.additional ?? property.innerDataType,
    );
    return enumValues.find(({ id }) => id === value["id"]);
  }

  private extendedCompare<T>(a: T, b: T): 1 | -1 | 0 {
    if (a instanceof Date && typeof b === "string") {
      return this.compareDates(a, b);
    } else {
      return compare(a, b);
    }
  }

  private compareDates(a: Date, b: string) {
    const [momentA, momentB] = [moment(a), moment(b)];
    if (momentA.isSame(momentB, "days")) {
      return 0;
    } else if (momentA.isBefore(momentB, "days")) {
      return -1;
    } else {
      return 1;
    }
  }
}
