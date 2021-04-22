import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Aggregation, ReportingService, ReportRow } from "../reporting.service";
import { MatStepper } from "@angular/material/stepper";

export interface ReportingComponentConfig {
  aggregationDefinitions?: Aggregation[];
}

@Component({
  selector: "app-reporting",
  templateUrl: "./reporting.component.html",
  styleUrls: ["./reporting.component.scss"],
})
export class ReportingComponent implements OnInit, AfterViewInit {
  private config: ReportingComponentConfig;
  results: ReportRow[];
  displayedColumns = ["label", "result"];
  step = 0;
  fromDate: Date;
  toDate: Date;
  @ViewChild(MatStepper) private stepper: MatStepper;

  constructor(
    private activatedRoute: ActivatedRoute,
    private reportingService: ReportingService
  ) {}

  ngOnInit() {
    this.activatedRoute.data.subscribe((config) => {
      if (config) {
        this.config = config;
        this.step = 1;
      }
    });
  }

  ngAfterViewInit() {
    // This is set here, because if `linear === true`, the stepper wont listen to changes of the `step` variable
    this.stepper.linear = true;
  }

  datesSelected() {
    // TODO allow to only select from date
    if (this.fromDate && this.toDate) {
      this.stepper.linear = false;
      if (this.step >= 2) {
        this.stepper.next();
      } else {
        this.step = 2;
      }
      setTimeout(() => (this.stepper.linear = true));
    }
  }

  async calculateResults() {
    this.reportingService.setAggregations(this.config.aggregationDefinitions);
    this.results = await this.reportingService.calculateReport(
      this.fromDate,
      this.toDate
    );
  }
}
