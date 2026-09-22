import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { Entity } from "../../entity/model/entity";

import { DataFilter, FilterSelectionOption, SelectableFilter } from "./filters";

export class ConfigurableEnumFilter<
  T extends Entity,
> extends SelectableFilter<T> {
  constructor(
    name: string,
    label: string,
    enumValues: ConfigurableEnumValue[],
    singleSelectOnly: boolean = false,
    invalidOptions: FilterSelectionOption<T>[] = [],
    isArrayField: boolean = false,
  ) {
    const options: FilterSelectionOption<T>[] = [
      ...enumValues.map((enumValue: ConfigurableEnumValue) => ({
        key: enumValue.id,
        label: enumValue.label,
        color: enumValue.color,
        filter: buildEnumValueFilter<T>(name, enumValue.id, isArrayField),
      })),
      ...invalidOptions,
    ];
    super(name, options, label, singleSelectOnly);
  }
}

/**
 * A plain equality selector only matches a multi-select (isArray) field
 * client-side (ucast implicitly treats it as "array contains"): CouchDB's
 * Mango `_find` does not, so a multi-select field needs `$elemMatch` to be
 * filtered correctly once online-only mode sends the query to CouchDB (#4406).
 */
export function buildEnumValueFilter<T extends Entity>(
  name: string,
  enumValueId: string,
  isArrayField: boolean,
): DataFilter<T> {
  if (isArrayField) {
    return {
      [name + ".id"]: { $elemMatch: { $eq: enumValueId } },
    } as DataFilter<T>;
  }
  return { [name + ".id"]: enumValueId } as DataFilter<T>;
}
