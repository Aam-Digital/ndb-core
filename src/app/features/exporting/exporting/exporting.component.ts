import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import {
  ReportConfig,
  ReportingComponentConfig,
} from "../../reporting/reporting/reporting-component-config";
import { ExportService } from "../../../core/export/export-service/export.service";

@Component({
  selector: "app-exporting",
  templateUrl: "./exporting.component.html",
  styleUrls: ["./exporting.component.scss"],
})
export class ExportingComponent implements OnInit {
  availableReports: ReportConfig[];
  loading = false;
  result: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private exportService: ExportService
  ) {}

  ngOnInit() {
    this.activatedRoute.data.subscribe(
      (data: RouteData<ReportingComponentConfig>) => {
        this.availableReports = data.config?.reports;
      }
    );
  }

  async createExport(report: ReportConfig, from: Date, to: Date) {
    this.result = await this.exportService.createCsv(
      undefined,
      report.aggregationDefinitions
    );
  }
}
