import { Component, Input } from "@angular/core";
import { getGroupingInformationString, ReportRow } from "../../report-row";
import { FlatTreeControl } from "@angular/cdk/tree";
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from "@angular/material/tree";
import { MatTableModule } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

interface FlattenedReportRow extends ReportRow {
  level: number;
  isExpandable: boolean;
}

@Component({
  selector: "app-report-row",
  templateUrl: "./report-row.component.html",
  styleUrls: ["./report-row.component.scss"],
  imports: [
    MatTableModule,
    MatButtonModule,
    FontAwesomeModule
  ],
  standalone: true
})
export class ReportRowComponent {
  @Input() set rows(rows: ReportRow[]) {
    this.dataSource.data = rows;
  }

  displayedColumns: string[] = ["name", "count"];

  getGroupedByString = getGroupingInformationString;
  treeFlattener = new MatTreeFlattener<ReportRow, FlattenedReportRow>(
    (row, level) => ({
      level: level,
      isExpandable: !!row.subRows && row.subRows.length > 0,
      ...row,
    }),
    (row) => row.level,
    (row) => row.isExpandable,
    (row) => row.subRows
  );
  treeControl = new FlatTreeControl<FlattenedReportRow>(
    (row) => row.level,
    (row) => row.isExpandable
  );
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
}
