import { Entity } from "#src/app/core/entity/model/entity";
import { MatSort } from "@angular/material/sort";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { MatPaginator } from "@angular/material/paginator";
import { effect } from "@angular/core";
import { EntityFilter } from "#src/app/core/filter/filters/entityFilter";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/entities-table-data-source";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";

export class PaginatedDataSource<
  T extends Entity,
> extends EntitiesTableDataSource<T> {
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

  /**
   * Total number of records reported to the paginator
   * (loaded pages plus at least one more record, if it exists).
   */
  private totalCount = 0;
  private effectiveFilter: DataFilter<T> = {};

  constructor() {
    super();
    effect(() => {
      this.effectiveFilter = this.processFilterForDB(this.dataFilter());
      this.setRecords();
    });
  }

  override async setRecords() {
    if (!this.loadRecordConfig()) return [];

    const res = await this.entityMapper.findType(
      this.loadRecordConfig().entityCtr,
      this.effectiveFilter,
      { skip: this.page.index * this.page.size, limit: this.page.size + 1 },
      this.sortState,
    );
    // TODO get total amount of elements
    this.totalCount = this.page.size * this.page.index + res.length;
    // `this.allRecords` stays empty
    this.filteredRecords.set(res.slice(0, this.page.size));
  }

  /**
   * Records are already paginated by the database query,
   * so the MatTableDataSource base class must not slice them again by page index.
   */
  override _pageData(data: TableRow<T>[]): TableRow<T>[] {
    return data;
  }

  /**
   * The MatTableDataSource base class updates the paginator with the length of the
   * loaded data (deferred, after every data change) - which here is only a single page.
   * Report the overall total from the database query instead,
   * otherwise the base class would overwrite paginator.length right after setRecords().
   */
  override _updatePaginator(_filteredDataLength: number): void {
    super._updatePaginator(this.totalCount);
  }

  protected override async processEntityUpdate({
    type,
    entity,
  }: UpdatedEntity<T>) {
    if (type === "update") {
      let updated = false;
      const updatedEntities = this.filteredRecords().map((e) => {
        if (e.getId() === entity.getId()) {
          updated = true;
          return entity;
        } else {
          return e;
        }
      });
      if (updated) {
        this.filteredRecords.set(updatedEntities);
      }
    } else {
      // We don't really know how it might affect the pages -> full reload
      await this.setRecords();
    }
  }

  private processFilterForDB(filter: DataFilter<T>): EntityFilter<T> {
    // isActive is not available in the database
    delete filter["isActive"];
    const filterString = JSON.stringify(filter);
    // replace e.g. "gender.id" with "gender" as configurable enums are only stored with id value
    const updatedString = filterString.replace(/("\w+)\.id(?="\:)/g, "$1");
    return JSON.parse(updatedString);
  }
}
