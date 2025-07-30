import { Component, inject, Input, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DashboardConfig } from "../../dashboard/dashboard/dashboard.component";
import { ConfigService } from "../../config/config.service";
import { PREFIX_VIEW_CONFIG } from "../../config/dynamic-routing/view-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import {
  AdminWidgetDialogComponent,
  AdminWidgetDialogData,
} from "../admin-widget-dialog/admin-widget-dialog.component";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { WidgetComponentSelectComponent } from "../admin-entity-details/widget-component-select/widget-component-select.component";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [
    DynamicComponentDirective,
    DragDropModule,
    FaIconComponent,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatIconModule,
    ViewTitleComponent,
  ],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: [
    "./admin-dashboard.component.scss",
    "../../dashboard/dashboard/dashboard.component.scss",
  ],
})
export class AdminDashboardComponent implements OnInit {
  @Input() dashboardViewId: string;
  @Input() isDisabled: boolean = false;

  dashboardConfig: DashboardConfig;
  private originalDashboardConfig: DashboardConfig;

  private readonly configService = inject(ConfigService);
  private readonly dialog = inject(MatDialog);
  private readonly location = inject(Location);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.loadDashboardViewConfig();
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        this.dashboardConfig.widgets,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      // Handle drop from available widgets
      const widgetType = event.previousContainer.data[event.previousIndex];
      const newWidget: DynamicComponentConfig = {
        component: widgetType.component,
        config: { ...widgetType.defaultConfig },
      };

      this.dashboardConfig.widgets.splice(event.currentIndex, 0, newWidget);
    }
  }

  async editWidget(widgetConfig: DynamicComponentConfig, idx: number) {
    const settingsComponent = this.getSettingsComponentforWidget(widgetConfig);
    if (!settingsComponent) return;

    const updatedConfig = await this.openWidgetSettingsDialog(
      widgetConfig,
      settingsComponent,
    );
    if (updatedConfig) {
      this.dashboardConfig.widgets[idx] = updatedConfig;
      this.dashboardConfig.widgets = [...this.dashboardConfig.widgets];
    }
  }

  getSettingsComponentforWidget(widgetConfig: DynamicComponentConfig): any {
    switch (widgetConfig.component) {
      case "ShortcutDashboard":
        return "ShortcutDashboardSettings";

      case "EntityCountDashboard":
        return "EntityCountDashboardSettings";

      case "ImportantNotesDashboard":
        return "ImportantNotesDashboardSettings";

      case "TodosDashboard":
        return "TodosDashboardSettings";

      case "NotesDashboard":
        return "NotesDashboardSettings";

      case "AttendanceWeekDashboard":
        return "AttendanceWeekDashboardSettings";

      case "ProgressDashboard":
        return "ProgressDashboardSettings";

      case "BirthdayDashboard":
        return "BirthdayDashboardSettings";

      default:
        return null;
    }
  }

  private async openWidgetSettingsDialog(
    widgetConfig: DynamicComponentConfig,
    settingsComponent: string,
  ): Promise<DynamicComponentConfig | undefined> {
    const dialogData: AdminWidgetDialogData = {
      widgetConfig: { ...widgetConfig },
      settingsComponent: settingsComponent,
      title: `${widgetConfig.component} Settings`,
    };

    const dialogRef = this.dialog.open(AdminWidgetDialogComponent, {
      width: "600px",
      data: dialogData,
    });

    return firstValueFrom(dialogRef.afterClosed());
  }

  removeWidget(index: number) {
    this.dashboardConfig.widgets.splice(index, 1);
  }

  async addNewWidget() {
    // Open the widget selection dialog for dashboard widgets
    const dialogRef = this.dialog.open(WidgetComponentSelectComponent, {
      width: "400px",
      data: { isDashboard: true },
    });

    const selectedWidget = await firstValueFrom(dialogRef.afterClosed());
    if (selectedWidget) {
      this.dashboardConfig.widgets.push(selectedWidget);
    }
  }

  cancel() {
    this.dashboardConfig = JSON.parse(
      JSON.stringify(this.originalDashboardConfig),
    );
    this.location.back();
  }

  async save() {
    const currentConfig = this.configService.exportConfig(true);

    const updatedViewConfig: DynamicComponentConfig<DashboardConfig> = {
      component: "Dashboard",
      config: this.dashboardConfig,
    };

    currentConfig[PREFIX_VIEW_CONFIG + this.dashboardViewId] =
      updatedViewConfig;

    await this.configService.saveConfig(currentConfig);

    this.snackBar.open(
      $localize`:Save config confirmation message:Dashboard configuration updated`,
      undefined,
      { duration: 4000 },
    );

    this.location.back();
  }

  private loadDashboardViewConfig() {
    const viewConfig: DynamicComponentConfig<DashboardConfig> =
      this.configService.getConfig(PREFIX_VIEW_CONFIG + this.dashboardViewId);

    this.dashboardConfig = JSON.parse(JSON.stringify(viewConfig?.config)) || {
      widgets: [],
    };
    this.originalDashboardConfig = JSON.parse(
      JSON.stringify(this.dashboardConfig),
    );
  }
}
