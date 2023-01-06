import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { NgForOf } from "@angular/common";

@Component({
  selector: "app-object-table",
  templateUrl: "./object-table.component.html",
  styleUrls: ["./object-table.component.scss"],
  imports: [
    MatTableModule,
    NgForOf,
    MatSortModule
  ],
  standalone: true
})
export class ObjectTableComponent implements OnChanges, AfterViewInit {
  @Input() objects: any[];

  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource();
  columns: string[];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("objects") && this.objects.length > 0) {
      this.dataSource.data = this.objects;
      this.columns = Object.keys(this.objects[0]);
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
}
