import { MatTableDataSource } from "@angular/material/table";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { effect, signal } from "@angular/core";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { SortValueFns } from "#src/app/core/common-components/entities-table/table-sort/table-sort";
import { LoaderMethod } from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";

export interface LoadRecordConfig<T extends Entity> {
  entityCtr: EntityConstructor<T>;
  forEntity?: Entity;
  relationProperty?: keyof Entity;
  loaderMethod?: LoaderMethod;
}

export abstract class EntitiesTableDataSource<
  T extends Entity,
> extends MatTableDataSource<TableRow<T>> {
  dataFilter = signal<DataFilter<T>>({});
  sortValueFns = signal<SortValueFns<T>>({});
  allRecords = signal<T[]>([]);
  filteredRecords = signal<T[]>([]);
  displayedData = signal<TableRow<T>[]>([]);
  loadRecordConfig = signal<LoadRecordConfig<T>>(undefined);
  isLoading = signal(false);

  // NOTE: overriding only the setter would hide the inherited `get data`,
  // so `dataSource.data` would return `undefined`. Provide both accessors.
  override get data(): TableRow<T>[] {
    return super.data;
  }

  override set data(data: TableRow<T>[]) {
    // expose signal containing current data
    this.displayedData.set(data);
    super.data = data;
  }

  protected constructor() {
    super();
    effect(() => {
      this.data = this.filteredRecords().map((record) => ({ record }));
    });
    effect(() => {
      if (this.loadRecordConfig()) {
        // If config is provided, this class loads the data and listens to updates
        this.setRecords();
        this.listenToEntityUpdates();
      }
    });
  }

  protected abstract setRecords();
  protected abstract listenToEntityUpdates(): void;
}
