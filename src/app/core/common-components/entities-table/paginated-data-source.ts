import { MatTableDataSource } from "@angular/material/table";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";
import { DataFilter } from "#src/app/core/filter/filters/filters";

export class PaginatedDataSource<T extends Entity> extends MatTableDataSource<
  TableRow<T>
> {
  private sortRef: MatSort;
  private sortState: { prop?: string; dir?: "asc" | "desc" } = {};
  override set sort(sort: MatSort) {
    this.sortRef = sort;
    this.updateSort(this.sortRef.active, this.sortRef.direction);
    this.sortRef.sortChange.subscribe(({ active, direction }) => {
      this.updateSort(active, direction);
    });
  }

  private updateSort(active: string, direction: "asc" | "desc" | "") {
    if (this.sortState.prop === active && this.sortState.dir === direction) {
      return;
    }
    if (direction === "") {
      this.sortState = {};
    } else {
      this.sortState = { prop: active, dir: direction };
    }
    this.loadData();
  }

  private _dataFilter: DataFilter<T> = {};
  set dataFiler(filter: DataFilter<T>) {
    // TODO isActive filter is not possible as this is not saved to database
    delete filter["isActive"];
    this._dataFilter = filter;
    this.loadData();
  }

  private pageSize: number;
  private pageIndex: number;
  private paginatorRef: MatPaginator;
  override set paginator(paginator: MatPaginator) {
    this.paginatorRef = paginator;
    this.paginatorRef.initialized.subscribe(() => {
      this.pageSize = this.paginatorRef.pageSize;
      this.pageIndex = this.paginatorRef.pageIndex;
      this.loadData();
    });
    this.paginatorRef.page.subscribe((val) => {
      this.pageSize = val.pageSize;
      this.pageIndex = val.pageIndex;
      this.loadData();
    });
  }

  private loadData() {
    this.entityMapper
      .findType(
        this.entityType,
        this._dataFilter,
        this.pageSize + 1,
        this.pageSize * this.pageIndex,
        this.sortState.prop,
        this.sortState.dir,
      )
      .then((res) => {
        super.data = res.map((record) => ({ record })).slice(0, this.pageSize);
        // TODO get total amount of elements
        this.paginatorRef.length = this.pageSize * this.pageIndex + res.length;
      });
  }

  override set data(data: TableRow<T>[]) {
    return;
  }

  override get data(): TableRow<T>[] {
    return super.data;
  }

  constructor(
    private entityType: EntityConstructor<T> | string,
    private entityMapper: EntityMapperService,
  ) {
    super();
  }
}
