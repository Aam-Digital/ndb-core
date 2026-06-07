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
        // TODO this needs to support both in-memory filter as well as database
        filter: { [name]: enumValue.id } as DataFilter<T>,
      })),
      ...invalidOptions,
    ];
    super(name, options, label, singleSelectOnly);
  }
}
