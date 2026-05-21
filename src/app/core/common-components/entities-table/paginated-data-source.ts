import { MatTableDataSource } from "@angular/material/table";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";

export class PaginatedDataSource<T extends Entity> extends MatTableDataSource<
  TableRow<T>
> {
  private sortRef: MatSort;
  override set sort(sort: MatSort) {
    this.sortRef = sort;
  }

  private paginatorRef: MatPaginator;
  override set paginator(paginator: MatPaginator) {
    this.paginatorRef = paginator;
    this.paginatorRef.page.subscribe((val) => {
      this.entityMapper
        .loadType(this.entityType, {
          limit: val.pageSize + 1,
          skip: val.pageIndex * val.pageSize,
        })
        .then((res) => {
          super.data = res.map((record) => ({ record })).slice(0, val.pageSize);
          // TODO get total amount of elements
          this.paginatorRef.length = val.pageSize * val.pageIndex + res.length;
        });
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
