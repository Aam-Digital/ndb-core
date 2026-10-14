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
  ) {
    const options: FilterSelectionOption<T>[] = [
      ...enumValues.map((enumValue: ConfigurableEnumValue) => ({
        key: enumValue.id,
        label: enumValue.label,
        color: enumValue.color,
        filter: buildEnumValueFilter<T>(name, enumValue.id),
      })),
      ...invalidOptions,
    ];
    super(name, options, label, singleSelectOnly);
  }
}

/**
 * Match records holding the given enum value, whether stored as a single value
 * or inside an array (multi-select / `isArray` field).
 *
 * Always both variants are matched, independent of the field's current `isArray`
 * setting, because that can be toggled in the admin UI while existing records
 * still hold values in the previous shape (same approach as `EntityFilter`).
 * A plain equality selector alone does not match array values in CouchDB's Mango
 * `_find` (unlike client-side, where ucast treats it as "array contains"), so
 * `$elemMatch` is needed for online-only mode (#4406).
 */
export function buildEnumValueFilter<T extends Entity>(
  name: string,
  enumValueId: string,
): DataFilter<T> {
  return {
    $or: [
      { [name + ".id"]: enumValueId },
      { [name + ".id"]: { $elemMatch: { $eq: enumValueId } } },
    ],
  } as DataFilter<T>;
}
