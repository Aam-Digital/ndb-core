import { Component, Input, OnInit } from "@angular/core";
import {
  ProgressDashboardConfig,
  ProgressDashboardPart,
} from "./progress-dashboard-config";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { LoggingService } from "../../../core/logging/logging.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { waitForChangeTo } from "../../../core/session/session-states/session-utils";
import { SyncState } from "../../../core/session/session-states/sync-state.enum";

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
    private loggingService: LoggingService,
    private sessionService: SessionService
  ) {}

  onInitFromDynamicConfig(config: any) {
    this.dashboardConfigId = config.dashboardConfigId;
  }

  ngOnInit() {
    this.data = new ProgressDashboardConfig(this.dashboardConfigId);
    this.entityMapper
      .load(ProgressDashboardConfig, this.dashboardConfigId)
      .catch(() => this.retryAfterSync())
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

  private retryAfterSync(): Promise<ProgressDashboardConfig> {
    return this.sessionService.syncState
      .pipe(waitForChangeTo(SyncState.COMPLETED))
      .toPromise()
      .then(() =>
        this.entityMapper.load(ProgressDashboardConfig, this.dashboardConfigId)
      );
  }

  private createDefaultConfig() {
    this.data.title = $localize`:The progress, e.g. of a certain activity:Progress of X`;
    this.addPart();
    this.addPart();
    this.save();
  }

  addPart() {
    const newPart: ProgressDashboardPart = {
      label: $localize`:Part of a whole:Part`,
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
