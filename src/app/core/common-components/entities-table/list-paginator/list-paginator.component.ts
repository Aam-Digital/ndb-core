import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  SkipSelf,
  ViewChild,
  inject,
} from "@angular/core";
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { PaginatedDataSource } from "#src/app/core/common-components/entities-table/data-source/paginated-data-source";
import { UnknownTotalPaginatorIntl } from "./unknown-total-paginator-intl";
import { LOCAL_STORAGE_TOKEN } from "../../../../utils/di-tokens";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
  imports: [MatPaginatorModule],
  providers: [
    {
      // component-scoped intl so the "10+" range label only affects this paginator;
      // delegates to the app-wide (translated) intl for everything else
      provide: MatPaginatorIntl,
      useFactory: (parent: MatPaginatorIntl) =>
        new UnknownTotalPaginatorIntl(parent),
      deps: [[new SkipSelf(), MatPaginatorIntl]],
    },
  ],
})
export class ListPaginatorComponent<E> {
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private readonly paginatorIntl = inject(
    MatPaginatorIntl,
  ) as UnknownTotalPaginatorIntl;
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

    effect(() => {
      const dataSource = this.dataSource();
      // only server-side paginated data sources have an unknown total
      const hasUnknownTotalCount =
        dataSource instanceof PaginatedDataSource &&
        dataSource.hasUnknownTotalCount();

      if (this.paginatorIntl.hasUnknownTotalCount !== hasUnknownTotalCount) {
        this.paginatorIntl.hasUnknownTotalCount = hasUnknownTotalCount;
        // notify the MatPaginator to re-render its range label
        this.paginatorIntl.changes.next();
      }
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
      this.localStorage.getItem(
        this.LOCAL_STORAGE_KEY + this.idForSavingPagination(),
      ),
    );
  }

  private savePageSize(size: number) {
    this.localStorage.setItem(
      this.LOCAL_STORAGE_KEY + this.idForSavingPagination(),
      size?.toString(),
    );
  }

  private bindPaginator(dataSource: MatTableDataSource<E> | undefined) {
    if (!dataSource || !this.paginator) return;
    dataSource.paginator = this.paginator;
  }
}
