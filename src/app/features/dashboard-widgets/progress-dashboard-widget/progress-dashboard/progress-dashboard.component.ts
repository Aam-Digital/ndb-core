import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from "@angular/core";
import { PercentPipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTableModule } from "@angular/material/table";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { filter, firstValueFrom } from "rxjs";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { Logging } from "../../../../core/logging/logging.service";
import { waitForChangeTo } from "../../../../core/session/session-states/session-utils";
import { SyncState } from "../../../../core/session/session-states/sync-state.enum";
import { SyncStateSubject } from "../../../../core/session/session-type";
import { EditProgressDashboardComponent } from "../edit-progress-dashboard/edit-progress-dashboard.component";
import { ProgressDashboardConfig } from "./progress-dashboard-config";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class ProgressDashboardComponent {
  private entityMapper = inject(EntityMapperService);
  private dialog = inject(MatDialog);
  private syncState = inject(SyncStateSubject);

  static getRequiredEntities() {
    return ProgressDashboardConfig.ENTITY_TYPE;
  }

  dashboardConfigId = input("");
  data = signal<ProgressDashboardConfig>(new ProgressDashboardConfig(""));

  subtitle = input<string>(
    $localize`:dashboard widget subtitle: Progress Overview`,
  );
  explanation = input<string>(
    $localize`:dashboard widget explanation: Shows the progress of different parts of project tasks. You can use this to track any kind of targets.`,
  );

  overallPercentage = computed(() => this.getOverallProgressPercentage());

  constructor() {
    effect((onCleanup) => {
      const dashboardConfigId = this.dashboardConfigId();
      let isCurrent = true;

      this.data.set(new ProgressDashboardConfig(dashboardConfigId));
      untracked(() => {
        void this.loadConfig(dashboardConfigId, () => isCurrent);
      });

      const subscription = this.entityMapper
        .receiveUpdates(ProgressDashboardConfig)
        .pipe(
          filter((entity) => entity.entity.getId(true) === dashboardConfigId),
        )
        .subscribe((update) => this.updateConfig(update.entity));

      onCleanup(() => {
        isCurrent = false;
        subscription.unsubscribe();
      });
    });
  }

  private async loadConfig(
    dashboardConfigId: string,
    isCurrent: () => boolean,
  ): Promise<void> {
    try {
      const config = await this.entityMapper.load(
        ProgressDashboardConfig,
        dashboardConfigId,
      );
      if (isCurrent()) {
        this.updateConfig(config);
      }
      return;
    } catch {
      // Retry after the next successful sync in case the config isn't available yet.
    }

    try {
      await firstValueFrom(
        this.syncState.pipe(waitForChangeTo(SyncState.COMPLETED)),
      );
      const config = await this.entityMapper.load(
        ProgressDashboardConfig,
        dashboardConfigId,
      );
      if (isCurrent()) {
        this.updateConfig(config);
      }
    } catch {
      if (isCurrent()) {
        this.createDefaultConfig();
      }
    }
  }

  private updateConfig(updatedConfig: ProgressDashboardConfig) {
    this.data.set(updatedConfig);
  }

  private createDefaultConfig() {
    const current = this.data();
    const next = this.cloneConfig(current);

    Logging.debug(
      `ProgressDashboardConfig (${this.dashboardConfigId()}) not found. Creating ...`,
    );
    next.title = $localize`:The progress, e.g. of a certain activity:Progress of X`;
    this.data.set(next);
    void this.save();
  }

  private cloneConfig(
    config: ProgressDashboardConfig,
  ): ProgressDashboardConfig {
    const clone = new ProgressDashboardConfig(config.getId(true));
    Object.assign(clone, config);
    return clone;
  }

  async save() {
    await this.entityMapper.save(this.data());
  }

  showEditComponent() {
    this.dialog
      .open(EditProgressDashboardComponent, {
        data: this.data(),
      })
      .afterClosed()
      .subscribe(async (next) => {
        if (next) {
          const updatedConfig = this.cloneConfig(this.data());
          Object.assign(updatedConfig, next);
          this.data.set(updatedConfig);
          await this.save();
        }
      });
  }

  // Calculates the weighted overall progress based on total current and target values.
  getOverallProgressPercentage(): number {
    const data = this.data();
    if (!data?.parts || data.parts.length === 0) {
      return 0;
    }

    let totalCurrent = 0;
    let totalTarget = 0;

    data.parts.forEach((entry) => {
      totalCurrent += entry.currentValue;
      totalTarget += entry.targetValue;
    });

    return totalTarget ? totalCurrent / totalTarget : 0;
  }
}
