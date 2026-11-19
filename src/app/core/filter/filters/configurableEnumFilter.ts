import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { Entity } from "../../entity/model/entity";

import { DataFilter, FilterSelectionOption, SelectableFilter } from "./filters";
import { referenceIdCondition } from "../../entity/default-datatype/default.datatype";

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
 * Both shapes are matched, independent of the field's current `isArray` setting,
 * because that can be toggled in the admin UI while existing records still hold
 * values in the previous shape (see {@link referenceIdCondition}).
 */
export function buildEnumValueFilter<T extends Entity>(
  name: string,
  enumValueId: string,
): DataFilter<T> {
  return referenceIdCondition(name + ".id", [enumValueId]);
}
