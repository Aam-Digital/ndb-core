import { Entity } from "../../entity/model/entity";
import { BooleanFilterConfig } from "../../entity-list/EntityListConfig";
import { DataFilter, SelectableFilter } from "./filters";

export class BooleanFilter<T extends Entity> extends SelectableFilter<T> {
  constructor(name: string, label: string, config?: BooleanFilterConfig) {
    super(
      name,
      [
        {
          key: "true",
          label:
            config.true ?? $localize`:Filter label default boolean true:Yes`,
          filter: { [config.id]: true } as DataFilter<T>,
        },
        {
          key: "false",
          label:
            config.false ?? $localize`:Filter label default boolean true:No`,
          filter: {
            [config.id]: { $in: [false, undefined] },
          } as DataFilter<T>,
        },
      ],
      label,
    );
  }
}
