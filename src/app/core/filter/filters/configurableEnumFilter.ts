import { Entity } from "../../entity/model/entity";
import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.interface";
import { FilterSelectionOption, SelectableFilter } from "./filters";
import { DataFilter } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";

export class ConfigurableEnumFilter<
  T extends Entity,
> extends SelectableFilter<T> {
  constructor(
    name: string,
    label: string,
    enumValues: ConfigurableEnumValue[],
  ) {
    let options: FilterSelectionOption<T>[] = [];
    options.push(
      ...enumValues.map((enumValue: ConfigurableEnumValue) => ({
        key: enumValue.id,
        label: enumValue.label,
        color: enumValue.color,
        filter: { [name + ".id"]: enumValue.id } as DataFilter<T>,
      })),
    );
    super(name, options, label);
  }
}
