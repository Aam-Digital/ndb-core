import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { Location } from "@angular/common";
import { Component, inject, Input, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { firstValueFrom } from "rxjs";
import { WidgetComponentSelectComponent } from "../../admin/admin-entity-details/widget-component-select/widget-component-select.component";
import {
  AdminWidgetDialogComponent,
  AdminWidgetDialogData,
} from "../../admin/admin-widget-dialog/admin-widget-dialog.component";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { ConfigService } from "../../config/config.service";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { PREFIX_VIEW_CONFIG } from "../../config/dynamic-routing/view-config.interface";
import { DashboardConfig } from "../../dashboard/dashboard/dashboard.component";
import { DashboardWidgetRegistryService } from "../dashboard-widget-registry.service";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { IconButtonComponent } from "#src/app/core/common-components/icon-button/icon-button.component";

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
    HintBoxComponent,
    IconButtonComponent,
  ],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: [
    "./admin-dashboard.component.scss",
    "../../dashboard/dashboard/dashboard.component.scss",
  ],
})
export class AdminDashboardComponent implements OnInit {
  @Input() dashboardViewId: string;

  dashboardConfig: DashboardConfig;

  private readonly configService = inject(ConfigService);
  private readonly dialog = inject(MatDialog);
  private readonly location = inject(Location);
  private readonly snackBar = inject(MatSnackBar);
  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  ngOnInit() {
    this.loadDashboardViewConfig();
  }

  private loadDashboardViewConfig() {
    const viewConfig: DynamicComponentConfig<DashboardConfig> =
      this.configService.getConfig(PREFIX_VIEW_CONFIG + this.dashboardViewId);

    this.dashboardConfig = JSON.parse(JSON.stringify(viewConfig?.config)) || {
      widgets: [],
    };
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        this.dashboardConfig.widgets,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  async editWidget(widgetConfig: DynamicComponentConfig, idx: number) {
    const settingsComponent = this.widgetRegistry.getSettingsComponentForWidget(
      widgetConfig.component,
    );
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

  private async openWidgetSettingsDialog(
    widgetConfig: DynamicComponentConfig,
    settingsComponent: string,
  ): Promise<DynamicComponentConfig | undefined> {
    const dialogData: AdminWidgetDialogData = {
      widgetConfig: { ...widgetConfig },
      settingsComponent: settingsComponent,
      title: widgetConfig.component,
    };

    const dialogRef = this.dialog.open(AdminWidgetDialogComponent, {
      width: "80vw",
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
}
