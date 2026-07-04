import { Entity } from "#src/app/core/entity/model/entity";
import { MatSort } from "@angular/material/sort";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { MatPaginator } from "@angular/material/paginator";
import { effect, inject } from "@angular/core";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/entities-table-data-source";

export class PaginatedDataSource<
  T extends Entity,
> extends EntitiesTableDataSource<T> {
  private readonly entityMapper = inject(EntityMapperService);

  private sortRef: MatSort;
  private sortState: { prop?: string; dir?: "asc" | "desc" } = {};
  override set sort(sort: MatSort) {
    this.sortRef = sort;
    this.updateSort(this.sortRef.active, this.sortRef.direction);
    this.sortRef.sortChange.subscribe(({ active, direction }) => {
      this.updateSort(active, direction);
    });
  }
  override get sort(): MatSort {
    return this.sortRef;
  }

  private updateSort(active: string, direction: "asc" | "desc" | "") {
    if (
      (direction === "" && this.sortState.dir === undefined) ||
      (this.sortState.prop === active && this.sortState.dir === direction)
    ) {
      return;
    }
    if (direction === "") {
      this.sortState = {};
    } else {
      this.sortState = { prop: active, dir: direction };
    }
    this.setRecords();
  }

  private page: { size?: number; index?: number } = {};
  private paginatorRef: MatPaginator;
  override set paginator(paginator: MatPaginator) {
    this.paginatorRef = paginator;
    this.paginatorRef.initialized.subscribe(() => {
      this.page.size = this.paginatorRef.pageSize;
      this.page.index = this.paginatorRef.pageIndex;
      this.setRecords();
    });
    this.paginatorRef.page.subscribe((val) => {
      this.page.size = val.pageSize;
      this.page.index = val.pageIndex;
      this.setRecords();
    });
  }
  override get paginator(): MatPaginator {
    return this.paginatorRef;
  }

  private effectiveFilter: DataFilter<T> = {};

  constructor() {
    effect(() => {
      this.effectiveFilter = this.dataFilter();
      delete this.effectiveFilter["isActive"];
      // this.setRecords();
    });
    super();
    effect(() => {
      this.filteredRecords.set(this.allRecords());
    });
  }

  protected override async getRecords(): Promise<T[]> {
    if (!this.loadRecordConfig()) return [];

    const res = await this.entityMapper.findType(
      this.loadRecordConfig().entityCtr,
      this.effectiveFilter,
      { skip: this.page.index * this.page.size, limit: this.page.size + 1 },
      this.sortState,
    );
    // TODO get total amount of elements
    this.paginatorRef.length = this.page.size * this.page.index + res.length;
    return res.slice(0, this.page.size);
  }
  override listenToEntityUpdates() {
    // throw new Error("Method not implemented.");
  }
}
