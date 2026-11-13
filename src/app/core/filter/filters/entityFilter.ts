import { Entity } from "../../entity/model/entity";
import { FilterSelectionOption, SelectableFilter } from "./filters";
import { referenceIdConditions } from "../../entity/default-datatype/default.datatype";

export class EntityFilter<T extends Entity> extends SelectableFilter<T> {
  constructor(name: string, label: string, filterEntities: Entity[]) {
    filterEntities.sort((a, b) => a.toString().localeCompare(b.toString()));
    const options: FilterSelectionOption<T>[] = filterEntities.map(
      (filterEntity) => ({
        key: filterEntity.getId(),
        label: filterEntity.toString(),
        filter: { $or: referenceIdConditions(name, filterEntity.getId()) },
      }),
    );
    super(name, options, label);
  }
}
