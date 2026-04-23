import {
  Component,
  ViewChild,
  ChangeDetectionStrategy,
  input,
  signal,
  effect,
} from "@angular/core";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-object-table",
  templateUrl: "./object-table.component.html",
  styleUrls: ["./object-table.component.scss"],
  imports: [MatTableModule, MatSortModule, MatPaginatorModule],
})
export class ObjectTableComponent {
  objects = input<any[]>([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource();
  columns = signal<string[]>([]);

  constructor() {
    effect(() => {
      const objs = this.objects();
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      if (objs?.length > 0) {
        this.columns.set(Object.keys(objs[0]));
        this.dataSource.data = objs;
      } else {
        this.columns.set([]);
      }
    });
  }
}
