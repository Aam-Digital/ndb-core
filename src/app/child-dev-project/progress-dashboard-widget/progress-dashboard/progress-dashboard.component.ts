import { Component, Input, OnInit } from "@angular/core";
import {
  ProgressDashboardConfig,
  ProgressDashboardPart,
} from "./progress-dashboard-config";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { LoggingService } from "../../../core/logging/logging.service";

@Component({
  selector: "app-progress-dashboard",
  templateUrl: "./progress-dashboard.component.html",
  styleUrls: ["./progress-dashboard.component.scss"],
})
export class ProgressDashboardComponent
  implements OnInitDynamicComponent, OnInit {
  @Input() dashboardConfigId = "";
  data: ProgressDashboardConfig;
  configure = false;

  constructor(
    private entityMapper: EntityMapperService,
    private loggingService: LoggingService
  ) {}

  onInitFromDynamicConfig(config: any) {
    this.dashboardConfigId = config.dashboardConfigId;
  }

  ngOnInit() {
    this.data = new ProgressDashboardConfig(this.dashboardConfigId);
    this.entityMapper
      .load<ProgressDashboardConfig>(
        ProgressDashboardConfig,
        this.dashboardConfigId
      )
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
    this.data.title = $localize`Progress of X`;
    this.addPart();
    this.addPart();
    this.save();
  }

  addPart() {
    const newPart: ProgressDashboardPart = {
      label: $localize`Part`,
      currentValue: 1,
      targetValue: 10,
    };
    this.data.parts.push(newPart);
  }

  async save() {
    await this.entityMapper.save(this.data);
    this.configure = false;
  }
}
