import { Entity } from "../../entity/model/entity";
import { getReadableValue } from "../entity-subrecord/entity-subrecord/sorting-accessor";

export function entityFilterPredicate<T extends Entity>(
  data: T,
  filter: string
): boolean {
  const keys = Object.keys(data);
  return keys.some((property) =>
    getReadableValue(data, property)
      ?.toString()
      .toLowerCase()
      .includes(filter)
  );
}
