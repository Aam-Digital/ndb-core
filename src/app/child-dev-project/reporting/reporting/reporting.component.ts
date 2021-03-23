import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Disaggregation, ReportingService } from "../reporting.service";

@Component({
  selector: "app-reporting",
  templateUrl: "./reporting.component.html",
  styleUrls: ["./reporting.component.scss"],
})
export class ReportingComponent implements OnInit {
  private config: { disaggregations?: Disaggregation[] };
  results: { label: string; result: any }[];
  displayedColumns = ["label", "result"];
  step = 0;
  fromDate: Date;
  toDate: Date;

  constructor(
    private activatedRoute: ActivatedRoute,
    private reportingService: ReportingService
  ) {}

  ngOnInit() {
    this.activatedRoute.data.subscribe((config) => {
      if (config) {
        this.config = config;
        this.step = 2;
      }
    });
  }

  datesSelected() {
    console.log("called", this.fromDate, this.toDate);
    if (this.fromDate && this.toDate) {
      console.log("true");
      this.step = 2;
    }
  }

  async calculateResults() {
    this.reportingService.setDisaggregations(this.config.disaggregations);
    this.results = await this.reportingService.calculateReport();
  }
}
