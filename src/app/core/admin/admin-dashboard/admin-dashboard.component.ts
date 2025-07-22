import { Component, inject, Input, OnInit } from "@angular/core";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DashboardConfig } from "../../dashboard/dashboard/dashboard.component";
import { ConfigService } from "../../config/config.service";
import { PREFIX_VIEW_CONFIG } from "../../config/dynamic-routing/view-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { CdkDragDrop, DragDropModule, moveItemInArray} from "@angular/cdk/drag-drop";
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
  AdminWidgetDialogData 
} from "../admin-widget-dialog/admin-widget-dialog.component";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";

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
    ViewTitleComponent
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

  private readonly configService = inject(ConfigService);
  private readonly dialog = inject(MatDialog);

  ngOnInit() {
    this.loadDashboardViewConfig();
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        this.dashboardConfig.widgets,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Handle drop from available widgets
      const widgetType = event.previousContainer.data[event.previousIndex]
      const newWidget: DynamicComponentConfig = {
        component: widgetType.component,
        config: { ...widgetType.defaultConfig }
      };
      
      this.dashboardConfig.widgets.splice(event.currentIndex, 0, newWidget);
    }
    
    //this.saveDashboardConfig();
  }

 async editWidget(widgetConfig: DynamicComponentConfig, idx: number) {
  const settingsComponent = this.getSettingsComponentforWidget(widgetConfig);
  if (!settingsComponent) return;

  const updatedConfig = await this.openWidgetSettingsDialog(widgetConfig, settingsComponent);
  if (updatedConfig) {
    this.dashboardConfig.widgets[idx] = updatedConfig;
    this.dashboardConfig.widgets = [...this.dashboardConfig.widgets]; // <-- Add this line
  }
}

  getSettingsComponentforWidget(widgetConfig: DynamicComponentConfig): any {
    switch (widgetConfig.component) {
      case 'ShortcutDashboard':
        return 'ShortcutDashboardSettings';
      
      case 'EntityCountDashboard':
        return 'EntityCountDashboardSettings';
      
      case 'ImportantNotesDashboard':
        return 'ImportantNotesDashboardSettings';
      
      case 'TodosDashboard':
        return 'NotEditableWidgetSettings';
      
      case 'NotesDashboard':
        return 'NotesDashboardSettings';
      
      case 'AttendanceWeekDashboard':
        return 'AttendanceWeekDashboardSettings';
      
      case 'ProgressDashboard':
        return 'NotEditableWidgetSettings';
      
      case 'BirthdayDashboard':
        return 'BirthdayDashboardSettings';
      
      default:
        return null;
    }
  }

  private async openWidgetSettingsDialog(
    widgetConfig: DynamicComponentConfig,
    settingsComponent: string
  ): Promise<DynamicComponentConfig | undefined> {
    const dialogData: AdminWidgetDialogData = {
      widgetConfig: { ...widgetConfig },
      settingsComponent: settingsComponent,
      title: `${widgetConfig.component} Settings`
    };

    const dialogRef = this.dialog.open(AdminWidgetDialogComponent, {
      width: "600px",
      data: dialogData,
    });
    
    return firstValueFrom(dialogRef.afterClosed());
  }

  removeWidget(index: number) {
    this.dashboardConfig.widgets.splice(index, 1);
    //this.saveDashboardConfig();
  }

  addNewWidget() {
    // TODO: Open dialog to select widget type
    console.log('Add new widget');
  }

  save(){
    //TODO: Implement save logic
  }
  
  cancel() {
    //TODO: Implement cancel logic
  }

  private loadDashboardViewConfig() {
    const viewConfig: DynamicComponentConfig<DashboardConfig> =
      this.configService.getConfig(PREFIX_VIEW_CONFIG + this.dashboardViewId);

    this.dashboardConfig = viewConfig?.config;
  }
}