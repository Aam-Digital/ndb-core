import { Component, Input, OnInit, inject } from "@angular/core";
import { ProgressDashboardConfig } from "./progress-dashboard-config";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { Logging } from "../../../../core/logging/logging.service";
import { MatDialog } from "@angular/material/dialog";
import { EditProgressDashboardComponent } from "../edit-progress-dashboard/edit-progress-dashboard.component";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { waitForChangeTo } from "../../../../core/session/session-states/session-utils";
import { SyncState } from "../../../../core/session/session-states/sync-state.enum";
import { filter, firstValueFrom } from "rxjs";
import { PercentPipe } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { SyncStateSubject } from "../../../../core/session/session-type";
import { DashboardWidget } from "../../../../core/dashboard/dashboard-widget/dashboard-widget";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";

@Component({
  selector: "app-progress-dashboard",
  templateUrl: "./progress-dashboard.component.html",
  styleUrls: ["./progress-dashboard.component.scss"],
  imports: [
    PercentPipe,
    MatTableModule,
    MatProgressBarModule,
    MatButtonModule,
    FontAwesomeModule,
    DashboardListWidgetComponent,
  ],
})
@DynamicComponent("ProgressDashboard")
export class ProgressDashboardComponent
  extends DashboardWidget
  implements OnInit
{
  private entityMapper = inject(EntityMapperService);
  private dialog = inject(MatDialog);
  private syncState = inject(SyncStateSubject);

  static override getRequiredEntities() {
    return ProgressDashboardConfig.ENTITY_TYPE;
  }

  @Input() dashboardConfigId = "";
  data: ProgressDashboardConfig;

  @Input() subtitle: string =
    $localize`:dashboard widget subtitle: Progress Overview`;
  @Input() explanation: string =
    $localize`:dashboard widget explanation: Shows the progress of different parts of project tasks. You can use this to track any kind of targets.`;

  overallPercentage: number;

  async ngOnInit() {
    this.data = new ProgressDashboardConfig(this.dashboardConfigId);
    this.loadConfigFromDatabase().catch(() =>
      firstValueFrom(this.syncState.pipe(waitForChangeTo(SyncState.COMPLETED)))
        .then(() => this.loadConfigFromDatabase())
        .catch(() => this.createDefaultConfig()),
    );

    this.entityMapper
      .receiveUpdates(ProgressDashboardConfig)
      .pipe(
        filter(
          (entity) => entity.entity.getId(true) === this.dashboardConfigId,
        ),
      )
      .subscribe((update) => this.updateConfig(update.entity));
  }

  private updateConfig(updatedConfig: ProgressDashboardConfig) {
    this.data = updatedConfig;
    this.overallPercentage = this.getOverallProgressPercentage();
  }

  private loadConfigFromDatabase() {
    return this.entityMapper
      .load(ProgressDashboardConfig, this.dashboardConfigId)
      .then((config) => this.updateConfig(config));
  }

  private createDefaultConfig() {
    Logging.debug(
      `ProgressDashboardConfig (${this.dashboardConfigId}) not found. Creating ...`,
    );
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
          Object.assign(this.data, next);
          await this.save();
        }
      });
  }

  // Method to calculate the overall progress percentage
  getOverallProgressPercentage(): number {
    if (!this.data?.parts || this.data.parts.length === 0) {
      return 0;
    }

    let totalCurrent = 0;
    let totalTarget = 0;

    this.data.parts.forEach((entry) => {
      totalCurrent += entry.currentValue;
      totalTarget += entry.targetValue;
    });

    return totalTarget ? totalCurrent / totalTarget : 0;
  }
}
