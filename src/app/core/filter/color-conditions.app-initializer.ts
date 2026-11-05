import { inject, provideAppInitializer } from "@angular/core";
import { Entity } from "../entity/model/entity";
import { FilterService } from "./filter.service";
import { DataFilter } from "./filters/filters";

/**
 * Match the conditions of conditional colors (see `Entity.color`) with the `FilterService`,
 * in the stored format like all other conditions.
 */
export function matchColorConditionsInStoredFormat() {
  const filterService = inject(FilterService);
  // the conditions are the config objects of the entity types, so the predicate of each is kept
  const predicates = new WeakMap<
    DataFilter<Entity>,
    (entity: Entity) => boolean
  >();
  Entity.matchesColorCondition = (entity, condition) => {
    let matches = predicates.get(condition);
    if (!matches) {
      matches = filterService.getFilterPredicate(condition);
      predicates.set(condition, matches);
    }
    return matches(entity);
  };
}

export const APP_INITIALIZER_COLOR_CONDITIONS = provideAppInitializer(
  matchColorConditionsInStoredFormat,
);
