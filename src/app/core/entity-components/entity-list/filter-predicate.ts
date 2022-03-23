import { Entity } from "../../entity/model/entity";
import { getReadableValue } from "../entity-subrecord/entity-subrecord/value-accessor";

export function entityFilterPredicate<T extends Entity, P extends keyof T>(
  data: T,
  filter: string
): boolean {
  const keys = Object.keys(data) as P[];
  return keys.some((property) =>
    getReadableValue(data, property)?.toString().toLowerCase().includes(filter)
  );
}
