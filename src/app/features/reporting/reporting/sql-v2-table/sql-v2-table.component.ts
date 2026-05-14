import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
  input,
} from "@angular/core";
import { SqlReport } from "../../report-config";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { SqlReportService } from "../../sql-report/sql-report.service";
import { Logging } from "../../../../core/logging/logging.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-sql-v2-table",
  imports: [MatTableModule, MatSortModule],
  templateUrl: "./sql-v2-table.component.html",
  styleUrl: "./sql-v2-table.component.scss",
})
export class SqlV2TableComponent {
  sqlReportService = inject(SqlReportService);

  report = input<SqlReport>();
  reportData = input<unknown[]>([]);
  isError = false;

  dataSource = new MatTableDataSource();
  columns: string[] = ["Name", "Count"];

  constructor() {
    effect(() => {
      try {
        this.dataSource.data = this.sqlReportService.flattenData(
          this.reportData(),
        );
        this.isError = false;
      } catch (error) {
        Logging.error(error);
        this.isError = true;
        this.dataSource.data = [];
      }
    });
  }
}
