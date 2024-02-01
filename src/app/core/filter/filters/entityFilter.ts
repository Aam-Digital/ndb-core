import { Entity } from "../../entity/model/entity";
import { FilterSelectionOption, SelectableFilter } from "./filters";

export class EntityFilter<T extends Entity> extends SelectableFilter<T> {
  constructor(name: string, label: string, filterEntities: Entity[]) {
    filterEntities.sort((a, b) => a.toString().localeCompare(b.toString()));
    const options: FilterSelectionOption<T>[] = filterEntities.map(
      (filterEntity) => ({
        key: filterEntity.getId(),
        label: filterEntity.toString(),
        filter: {
          $or: [
            { [name]: filterEntity.getId() },
            { [name]: { $elemMatch: { $eq: filterEntity.getId() } } },
          ],
        },
      }),
    );
    super(name, options, label);
  }
}
