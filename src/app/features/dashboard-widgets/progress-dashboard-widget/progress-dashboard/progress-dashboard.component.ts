import { Component, Input, OnInit } from "@angular/core";
import { ProgressDashboardConfig } from "./progress-dashboard-config";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { LoggingService } from "../../../../core/logging/logging.service";
import { MatDialog } from "@angular/material/dialog";
import { EditProgressDashboardComponent } from "../edit-progress-dashboard/edit-progress-dashboard.component";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { SessionService } from "../../../../core/session/session-service/session.service";
import { waitForChangeTo } from "../../../../core/session/session-states/session-utils";
import { SyncState } from "../../../../core/session/session-states/sync-state.enum";
import { firstValueFrom } from "rxjs";
import { PercentPipe } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DashboardWidgetComponent } from "../../../../core/dashboard/dashboard-widget/dashboard-widget.component";
import { WidgetContentComponent } from "../../../../core/dashboard/dashboard-widget/widget-content/widget-content.component";

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
    DashboardWidgetComponent,
    WidgetContentComponent,
  ],
  standalone: true,
})
@DynamicComponent("ProgressDashboard")
export class ProgressDashboardComponent implements OnInit {
  @Input() dashboardConfigId = "";
  data: ProgressDashboardConfig;

  constructor(
    private entityMapper: EntityMapperService,
    private loggingService: LoggingService,
    private dialog: MatDialog,
    private sessionService: SessionService,
  ) {}

  async ngOnInit() {
    this.data = new ProgressDashboardConfig(this.dashboardConfigId);
    this.loadConfigFromDatabase().catch(() =>
      firstValueFrom(
        this.sessionService.syncState.pipe(
          waitForChangeTo(SyncState.COMPLETED),
        ),
      )
        .then(() => this.loadConfigFromDatabase())
        .catch(() => this.createDefaultConfig()),
    );
  }

  private loadConfigFromDatabase() {
    return this.entityMapper
      .load(ProgressDashboardConfig, this.dashboardConfigId)
      .then((config) => (this.data = config));
  }

  private createDefaultConfig() {
    this.loggingService.debug(
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
}
