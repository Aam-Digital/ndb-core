import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  ViewChild,
} from "@angular/core";
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { PaginatedDataSource } from "#src/app/core/common-components/entities-table/data-source/paginated-data-source";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
  imports: [MatPaginatorModule],
})
export class ListPaginatorComponent<E> {
  readonly LOCAL_STORAGE_KEY = "PAGINATION-";
  readonly pageSizeOptions = [10, 20, 50, 100];

  dataSource = input<MatTableDataSource<E>>();
  idForSavingPagination = input<string>();
  showFirstLast = computed(
    () => !(this.dataSource() instanceof PaginatedDataSource),
  );

  private readonly paginatorReady = signal(false);
  @ViewChild(MatPaginator, { static: true })
  set paginatorRef(paginator: MatPaginator) {
    this.paginator = paginator;
    this.paginatorReady.set(!!paginator);
  }
  paginator: MatPaginator;

  readonly pageSize = signal(10);

  constructor() {
    effect(() => {
      if (this.idForSavingPagination() !== undefined) {
        this.applyUserPaginationSettings();
      }
    });

    effect(() => {
      this.paginatorReady();
      this.bindPaginator(this.dataSource());
    });
  }

  onPaginateChange(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.savePageSize(this.pageSize());
  }

  private applyUserPaginationSettings() {
    const savedSize = this.getSavedPageSize();
    this.pageSize.set(
      savedSize && savedSize !== -1 ? savedSize : this.pageSize(),
    );
  }

  private getSavedPageSize(): number {
    return Number.parseInt(
      localStorage.getItem(
        this.LOCAL_STORAGE_KEY + this.idForSavingPagination(),
      ),
    );
  }

  private savePageSize(size: number) {
    localStorage.setItem(
      this.LOCAL_STORAGE_KEY + this.idForSavingPagination(),
      size?.toString(),
    );
  }

  private bindPaginator(dataSource: MatTableDataSource<E> | undefined) {
    if (!dataSource || !this.paginator) return;
    dataSource.paginator = this.paginator;
  }
}
