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
    data?: T[],
  ) {
    // Create valid enum options first
    const validOptions: FilterSelectionOption<T>[] = enumValues.map(
      (enumValue: ConfigurableEnumValue) => ({
        key: enumValue.id,
        label: enumValue.label,
        color: enumValue.color,
        filter: { [name + ".id"]: enumValue.id } as DataFilter<T>,
      }),
    );

    // Collect invalid and empty options if data is provided
    let allOptions: FilterSelectionOption<T>[] = [...validOptions];
    
    if (data) {
      const validEnumIds = new Set(enumValues.map(v => v.id));
      const invalidOptions = ConfigurableEnumFilter.collectInvalidOptions(data, name, validEnumIds);
      allOptions = [...allOptions, ...invalidOptions];

      // Add "empty/not defined" option if there are entities with empty values
      const hasEmptyValues = data.some(entity => {
        const value = entity[name];
        return !value || (value.id === undefined || value.id === "");
      });

      if (hasEmptyValues) {
        allOptions.push({
          key: "__empty__",
          label: $localize`:filter option for empty values:not defined`,
          filter: {
            $or: [
              { [name]: { $exists: false } },
              { [name]: null },
              { [name + ".id"]: "" },
              { [name + ".id"]: { $exists: false } },
            ]
          } as DataFilter<T>,
          cssClass: "empty-option",
        });
      }
    }

    super(name, allOptions, label, singleSelectOnly);
  }

  private static collectInvalidOptions<T extends Entity>(
    data: T[],
    fieldName: string,
    validEnumIds: Set<string>
  ): FilterSelectionOption<T>[] {
    const invalidIds = new Set<string>();
    
    data.forEach(entity => {
      const value = entity[fieldName];
      if (value && value.id && !validEnumIds.has(value.id)) {
        invalidIds.add(value.id);
      }
    });

    return Array.from(invalidIds).map(invalidId => ({
      key: invalidId,
      label: $localize`:enum option label prefix for invalid id dummy:[invalid option]` + " " + invalidId,
      filter: { [fieldName + ".id"]: invalidId } as DataFilter<T>,
      cssClass: "invalid-option",
    }));
  }
}
