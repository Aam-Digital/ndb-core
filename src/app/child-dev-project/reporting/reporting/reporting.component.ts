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
  public results: { label: string; result: any }[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private reportingService: ReportingService
  ) {
    this.activatedRoute.data.subscribe((config) => {
      this.config = config;
    });
  }

  ngOnInit(): void {}

  async calculateResults() {
    this.reportingService.setDisaggregations(this.config.disaggregations);
    this.results = await this.reportingService.calculateReport();
  }
}
