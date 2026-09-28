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
          // not `$in: [false, undefined]`: CouchDB (3.5.2) crashes with a
          // "function_clause" 500 error on a Mango `$in` selector containing
          // `null` whenever the query is forced to a specific `use_index`
          // (as every sorted online-only list does) - `$eq`/`$exists` don't
          // trigger that bug.
          filter: {
            $or: [
              { [config.id]: false },
              { [config.id]: { $exists: false } },
              { [config.id]: { $eq: null } },
            ],
          } as DataFilter<T>,
        },
      ],
      label,
    );
  }
}
