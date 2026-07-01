import { Entity } from "../../entity/model/entity";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { MatTableDataSource } from "@angular/material/table";
import { effect, inject, signal } from "@angular/core";
import { FilterService } from "#src/app/core/filter/filter.service";
import { entityFilterPredicate } from "#src/app/core/filter/filter-generator/filter-predicate";
import { SortValueFns, tableSort } from "#src/app/core/common-components/entities-table/table-sort/table-sort";

export class InMemoryDataSource<T extends Entity> extends MatTableDataSource<
  TableRow<T>
> {
  override set data(data: TableRow<T>[]) {
    this.displayedData.set(data);
    super.data = data;
  }
  private filterService = inject(FilterService);
  dataFilter = signal<DataFilter<T>>({});
  sortValueFns = signal<SortValueFns<T>>({});
  allRecords = signal<T[]>([]);
  filteredRecords = signal<T[]>([]);
  displayedData = signal<TableRow<T>[]>([]);

  constructor() {
    super();
    effect(() => {
      super.data = this.filteredRecords().map((record) => ({ record }));
    });
    effect(() => {
      const records = this.allRecords();
      const predicate = this.filterService.getFilterPredicate(
        this.dataFilter(),
      );
      const domainFiltered = records.filter(predicate);
      this.filteredRecords.set(domainFiltered);
    });
  }

  override filterPredicate = (data: TableRow<T>, filter: string) =>
    entityFilterPredicate(data.record, filter);

  override sortData = (data, sort) =>
    tableSort<T, keyof T>(data, {
      active: (sort.active as keyof T) ?? "",
      direction: sort.direction,
      sortValueFns: this.sortValueFns(),
    });
}
