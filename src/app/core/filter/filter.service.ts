import { Injectable } from "@angular/core";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { ConfigService } from "../config/config.service";
import { DataFilter } from "../entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Entity } from "../entity/model/entity";
import {
  createFactory,
  allParsingInstructions,
  allInterpreters,
  Filter,
  compare,
} from "@ucast/mongo2js";
import moment from "moment";

@Injectable({
  providedIn: "root",
})
export class FilterService {
  private filterFactory = createFactory(
    allParsingInstructions,
    allInterpreters,
    { compare: this.extendedCompare.bind(this) }
  ) as Filter;

  constructor(private configService: ConfigService) {}

  getFilterPredicate<T extends Entity>(filter: DataFilter<T>) {
    return this.filterFactory<T>(filter);
  }

  alignEntityWithFilter<T extends Entity>(newNote: T, filter: DataFilter<T>) {
    const schema = newNote.getSchema();
    Object.entries(filter ?? {}).forEach(([key, value]) => {
      // TODO support arrays through recursion
      if (typeof value !== "object") {
        this.assignValueToEntity(key, value, schema, newNote);
      }
    });
  }

  private assignValueToEntity<T extends Entity>(
    key: string,
    value,
    schema: Map<string, EntitySchemaField>,
    newNote: T
  ) {
    if (key.includes(".")) {
      // TODO only one level deep nesting is supported (also by ucast https://github.com/stalniy/ucast/issues/32)
      [key, value] = this.transformNestedKey(key, value);
    }
    const property = schema.get(key);
    if (property.dataType === "configurable-enum") {
      value = this.parseConfigurableEnumValue(property, value);
    }
    newNote[key] = value;
  }

  private transformNestedKey(key: string, value): any[] {
    const [first, second] = key.split(".");
    return [first, { [second]: value }];
  }

  private parseConfigurableEnumValue(property: EntitySchemaField, value) {
    const enumValues = this.configService.getConfigurableEnumValues(
      property.innerDataType
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
    const diff = moment(a).diff(new Date(b), "days");
    if (diff < 0) {
      return -1;
    } else if (diff > 0) {
      return 1;
    } else {
      return 0;
    }
  }
}
