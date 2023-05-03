import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { NgForOf } from "@angular/common";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";

@Component({
  selector: "app-object-table",
  templateUrl: "./object-table.component.html",
  styleUrls: ["./object-table.component.scss"],
  imports: [MatTableModule, NgForOf, MatSortModule, MatPaginatorModule],
  standalone: true,
})
export class ObjectTableComponent implements OnInit {
  @Input() objects: any[];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource();
  columns: string[];

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.columns = Object.keys(this.objects[0]);
    this.dataSource.data = this.objects;
  }
}
