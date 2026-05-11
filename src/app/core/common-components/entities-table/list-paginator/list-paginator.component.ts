import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  effect,
  input,
} from "@angular/core";
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
  imports: [MatPaginatorModule],
})
export class ListPaginatorComponent<E> implements OnInit {
  readonly LOCAL_STORAGE_KEY = "PAGINATION-";
  readonly pageSizeOptions = [10, 20, 50, 100];

  dataSource = input<MatTableDataSource<E>>();
  idForSavingPagination = input<string>();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  pageSize = 10;

  constructor() {
    effect(() => {
      if (this.idForSavingPagination() !== undefined) {
        this.applyUserPaginationSettings();
      }
    });

    effect(() => {
      if (this.paginator) {
        this.bindPaginator(this.dataSource());
      }
    });
  }

  ngOnInit() {
    this.bindPaginator(this.dataSource());
  }

  onPaginateChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.savePageSize(this.pageSize);
  }

  private applyUserPaginationSettings() {
    const savedSize = this.getSavedPageSize();
    this.pageSize = savedSize && savedSize !== -1 ? savedSize : this.pageSize;
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
