import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.interface";
import { DataFilter, FilterSelectionOption, SelectableFilter } from "./filters";

export class ConfigurableEnumFilter<
  T extends Entity,
> extends SelectableFilter<T> {
  constructor(
    name: string,
    label: string,
    enumValues: ConfigurableEnumValue[],
  ) {
    const options: FilterSelectionOption<T>[] = enumValues.map(
      (enumValue: ConfigurableEnumValue) => ({
        key: enumValue.id,
        label: enumValue.label,
        color: enumValue.color,
        filter: { [name + ".id"]: enumValue.id } as DataFilter<T>,
      }),
    );
    super(name, options, label);
  }
}
