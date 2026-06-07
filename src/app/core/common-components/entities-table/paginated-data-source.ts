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
  override set sort(sort: MatSort) {
    this.sortRef = sort;
  }

  private _dataFilter: DataFilter<T>;
  set dataFiler(filter: DataFilter<T>) {
    // TODO isActive filter is not possible as this is not saved to database
    delete filter["isActive"];
    this.entityMapper.findType(this.entityType, filter).then((res) => {
      super.data = res.map((record) => ({ record }));
    });
    this._dataFilter = filter;
  }

  private paginatorRef: MatPaginator;
  override set paginator(paginator: MatPaginator) {
    this.paginatorRef = paginator;
    this.paginatorRef.initialized.subscribe(() => {
      this.loadData(this.paginatorRef.pageSize, this.paginatorRef.pageIndex);
    });
    this.paginatorRef.page.subscribe((val) => {
      this.loadData(val.pageSize, val.pageIndex);
    });
  }

  private loadData(pageSize: number, pageIndex: number) {
    this.entityMapper
      .loadType(this.entityType, {
        limit: pageSize + 1,
        skip: pageSize * pageIndex,
      })
      .then((res) => {
        super.data = res.map((record) => ({ record })).slice(0, pageSize);
        // TODO get total amount of elements
        this.paginatorRef.length = pageSize * pageIndex + res.length;
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
