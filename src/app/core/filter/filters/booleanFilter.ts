import { Entity } from "../../entity/model/entity";
import { BooleanFilterConfig } from "../../entity-list/EntityListConfig";
import { SelectableFilter } from "./filters";
import { DataFilter } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";

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
