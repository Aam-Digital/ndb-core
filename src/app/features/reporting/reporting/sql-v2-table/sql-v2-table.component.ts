import { Component, inject, Input, OnInit } from "@angular/core";
import { SqlReport } from "../../report-config";
import { JsonPipe, NgClass, NgForOf } from "@angular/common";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import {
  SqlReportRow,
  SqlReportService,
} from "../../sql-report/sql-report.service";

@Component({
  selector: "app-sql-v2-table",
  standalone: true,
  imports: [MatTableModule, NgForOf, MatSortModule, NgClass, JsonPipe],
  templateUrl: "./sql-v2-table.component.html",
  styleUrl: "./sql-v2-table.component.scss",
})
export class SqlV2TableComponent implements OnInit {
  sqlReportService = inject(SqlReportService);

  @Input() report: SqlReport;

  @Input() set reportData(value: any[]) {
    this.data = this.formatData(value);
  }

  isError = false;

  dataSource = new MatTableDataSource();
  columns: string[] = ["Name", "Anzahl"]; // todo translate?

  data: SqlReportRow[] = [];

  ngOnInit(): void {
    this.dataSource.data = this.data;
  }

  private formatData(value: any[]) {
    this.isError = false;
    try {
      return this.sqlReportService.flattenData(value);
    } catch (error) {
      console.log(error);
      this.isError = true;
    }
  }
}
