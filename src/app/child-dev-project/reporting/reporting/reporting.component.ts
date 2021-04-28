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
  }
}
