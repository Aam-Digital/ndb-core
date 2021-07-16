import { Entity } from "../../entity/model/entity";
import { entityListSortingAccessor } from "../entity-subrecord/entity-subrecord/sorting-accessor";

export function entityFilterPredicate<T extends Entity>(
  data: T,
  filter: string
): boolean {
  const keys = Object.keys(data);
  return keys.some((property) =>
    entityListSortingAccessor(data, property)
      ?.toString()
      .toLowerCase()
      .includes(filter)
  );
}
