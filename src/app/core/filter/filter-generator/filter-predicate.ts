import { Entity } from "../../entity/model/entity";
import { getReadableValue } from "../../common-components/entities-table/value-accessor/value-accessor";

export function entityFilterPredicate(data: Entity, filter: string): boolean {
  return [...Object.values(data)].some((value) =>
    String(getReadableValue(value)).toLowerCase().includes(filter),
  );
}
