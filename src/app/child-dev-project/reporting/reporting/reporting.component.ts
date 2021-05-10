import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Aggregation, ReportingService, ReportRow } from "../reporting.service";

export interface ReportingComponentConfig {
  aggregationDefinitions?: Aggregation[];
}

@Component({
  selector: "app-reporting",
  templateUrl: "./reporting.component.html",
  styleUrls: ["./reporting.component.scss"],
})
export class ReportingComponent implements OnInit {
  config: ReportingComponentConfig;
  results: ReportRow[];
  fromDate: Date;
  toDate: Date;
  reportTable: { label: string; result: any }[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private reportingService: ReportingService
  ) {}

  ngOnInit() {
    this.activatedRoute.data.subscribe((config) => (this.config = config));
  }

  async calculateResults() {
    this.reportingService.setAggregations(this.config.aggregationDefinitions);
    this.results = await this.reportingService.calculateReport(
      this.fromDate,
      this.toDate
    );
    this.reportTable = this.getExportTable();
  }

  private getExportTable(
    rows = this.results
  ): { label: string; result: any }[] {
    const tableRows: { label: string; result: any }[] = [];
    rows.forEach((result) => {
      tableRows.push(this.createExportableRow(result.header));
      tableRows.push(...this.getExportTable(result.subRows));
    });
    return tableRows;
  }

  private createExportableRow(header: {
    label: string;
    values?: string[];
    result: any;
  }): { label: string; result: any } {
    let resultLabel = header.label;
    if (header.values?.length > 0) {
      resultLabel += " (" + header.values.join(", ") + ")";
    }
    return { label: resultLabel, result: header.result };
  }
}
