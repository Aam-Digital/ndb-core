import {
  Component,
  Input,
  OnChanges,
  ViewChild,
  ChangeDetectionStrategy,
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
export class ObjectTableComponent implements OnChanges {
  @Input() objects: any[];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource();
  columns: string[];

  ngOnChanges() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.objects?.length > 0) {
      this.columns = Object.keys(this.objects[0]);
      this.dataSource.data = this.objects;
    }
  }
}
