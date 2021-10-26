import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { DashboardTheme } from "../dashboard-widget/dashboard-widget.component";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";

@Component({
  selector: "app-dashboard-table-widget",
  templateUrl: "./dashboard-table-widget.component.html",
  styleUrls: ["./dashboard-table-widget.component.scss"],
})
export class DashboardTableWidgetComponent implements AfterViewInit, OnChanges {
  @Input() subtitle: string;
  @Input() icon: string;
  @Input() theme: DashboardTheme;
  /** optional tooltip to explain detailed meaning of this widget / statistic */
  @Input() explanation: string;
  @Input() data: any[] = [];
  columnsToDisplay: string[] = ["name", "daysSinceLastNote"];
  tableDataSource = new MatTableDataSource<any>();
  dataLength: number = 0;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.tableDataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("data")) {
      this.tableDataSource.data = this.data;
      this.tableDataSource.paginator = this.paginator;
      this.dataLength = this.data.length;
    }
  }
}
