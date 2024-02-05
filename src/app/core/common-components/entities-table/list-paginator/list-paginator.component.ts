import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";

@Component({
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
  imports: [MatPaginatorModule],
  standalone: true,
})
export class ListPaginatorComponent<E> implements OnChanges, OnInit {
  readonly LOCAL_STORAGE_KEY = "PAGINATION-";
  readonly pageSizeOptions = [10, 20, 50, 100];

  @Input() dataSource: MatTableDataSource<E>;
  @Input() idForSavingPagination: string;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  pageSize = 10;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("idForSavingPagination")) {
      this.applyUserPaginationSettings();
    }
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
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
      localStorage.getItem(this.LOCAL_STORAGE_KEY + this.idForSavingPagination),
    );
  }

  private savePageSize(size: number) {
    localStorage.setItem(
      this.LOCAL_STORAGE_KEY + this.idForSavingPagination,
      size?.toString(),
    );
  }
}
