import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { SqlReport } from "../../report-config";
import { JsonPipe, NgClass, NgForOf } from "@angular/common";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";

@Component({
  selector: "app-sql-v2-table",
  standalone: true,
  imports: [MatTableModule, NgForOf, MatSortModule, NgClass, JsonPipe],
  templateUrl: "./sql-v2-table.component.html",
  styleUrl: "./sql-v2-table.component.scss",
})
export class SqlV2TableComponent implements OnInit {
  @Input() report: SqlReport;

  @Input() set reportData(value: any[]) {
    this.data = this.flattenData(value);
  }

  dataSource = new MatTableDataSource();
  columns: string[] = ["Name", "Anzahl"];

  data: { key: string; value: any; level: number }[] = [];

  ngOnInit(): void {
    this.dataSource.data = this.data;
  }

  flattenData(
    data: any[],
    level = 0,
  ): { key: string; value: any; level: number }[] {
    const result: { key: string; value: any; level: number }[] = [];

    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        const value = item[key];
        if (Array.isArray(value)) {
          result.push({
            key,
            value: value
              .flatMap((value) => {
                return Object.values(value).filter(
                  (value) => typeof value === "number",
                );
              })
              .reduce(
                (previousValue: number, currentValue: number) =>
                  previousValue + currentValue,
              ),
            level,
          });
          result.push(...this.flattenData(value, level + 1));
        } else {
          result.push({ key, value, level });
        }
      });
    });

    return result;
  }
}
