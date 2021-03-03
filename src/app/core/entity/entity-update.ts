import { Entity } from "./entity";
import { OperatorFunction } from "rxjs";
import { map } from "rxjs/operators";

export type UpdateFn<T> = (what: T[]) => T[];

/**
 * Returns an {@link OperatorFunction} that can be used in a rxjs-pipe
 * to map incoming data to an update-function.
 * This function takes an array of entities and returns a modified version
 * of the same array. This array contains the new element from the observable,
 * either inserted (if an element with the same ID was not seen before),
 * or a new one (if an element with the same ID was seen before and should now be updated)
 * See {@linkplain EntityMapperService.loadAll loadAll} for a use-case example
 */

export function updateEntities<T extends Entity>(): OperatorFunction<T, UpdateFn<T>> {
  return map((next: T) => {
    return (what: T[]) => {
      if (next) {
        const index = what.findIndex((value) => value.getId() === next.getId());
        if (index !== -1) {
          what.splice(index, 1);
        }
        return [next].concat(what);
      } else {
        return [];
      }
    };
  });
}
