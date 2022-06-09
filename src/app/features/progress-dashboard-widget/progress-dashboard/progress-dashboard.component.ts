import { Component, Input, OnInit } from "@angular/core";
import { ProgressDashboardConfig } from "./progress-dashboard-config";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { LoggingService } from "../../../core/logging/logging.service";
import { MatDialog } from "@angular/material/dialog";
import { EditProgressDashboardComponent } from "../edit-progress-dashboard/edit-progress-dashboard.component";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";

@Component({
  selector: "app-progress-dashboard",
  templateUrl: "./progress-dashboard.component.html",
  styleUrls: ["./progress-dashboard.component.scss"],
})
@DynamicComponent("ProgressDashboard")
export class ProgressDashboardComponent
  implements OnInitDynamicComponent, OnInit {
  @Input() dashboardConfigId = "";
  data: ProgressDashboardConfig;

  constructor(
    private entityMapper: EntityMapperService,
    private loggingService: LoggingService,
    private dialog: MatDialog
  ) {}

  onInitFromDynamicConfig(config: any) {
    this.dashboardConfigId = config.dashboardConfigId;
  }

  ngOnInit() {
    this.data = new ProgressDashboardConfig(this.dashboardConfigId);
    this.entityMapper
      .load(ProgressDashboardConfig, this.dashboardConfigId)
      .then((config) => {
        this.data = config;
      })
      .catch((e) => {
        if (e.status === 404) {
          this.loggingService.debug(
            `ProgressDashboardConfig (${this.dashboardConfigId}) not found. Creating ...`
          );
          this.createDefaultConfig();
        } else {
          this.loggingService.warn(
            `Error loading ProgressDashboardConfig (${this.dashboardConfigId}): ${e.message}`
          );
        }
      });
  }

  private createDefaultConfig() {
    this.data.title = $localize`:The progress, e.g. of a certain activity:Progress of X`;
    this.save();
  }

  async save() {
    await this.entityMapper.save(this.data);
  }

  showEditComponent() {
    this.dialog
      .open(EditProgressDashboardComponent, {
        data: this.data,
      })
      .afterClosed()
      .subscribe(async (next) => {
        if (next) {
          console.warn(this.data)
          this.data.parts = next;
          await this.save();
        }
      });
  }
}
