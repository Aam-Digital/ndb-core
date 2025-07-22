import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";

export interface AdminWidgetDialogData {
  widgetConfig: DynamicComponentConfig;
  settingsComponent: string;
  title: string;
}

@Component({
  selector: "app-admin-widget-dialog",
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    DynamicComponentDirective
  ],
  templateUrl: "./admin-widget-dialog.component.html",
  styleUrls: ["./admin-widget-dialog.component.scss"]
})
export class AdminWidgetDialogComponent {
  settingsComponentConfig: DynamicComponentConfig;
  updatedConfig: any;

  constructor(
  public dialogRef: MatDialogRef<AdminWidgetDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: AdminWidgetDialogData
) {
  console.log('=== DIALOG DEBUG ===');
  console.log('Widget config:', this.data.widgetConfig);
  console.log('Widget config.config:', this.data.widgetConfig.config);

  // Pass the config object as-is!
  this.settingsComponentConfig = {
    component: data.settingsComponent,
    config: data.widgetConfig.config || {}
  };

  console.log('Settings component config being passed:', this.settingsComponentConfig);
  this.updatedConfig = { ...data.widgetConfig };
}

  onConfigChange(newConfig: any) {
  this.updatedConfig = {
    ...this.updatedConfig,
    config: {
      ...this.updatedConfig.config,
      ...newConfig
    }
  };
}

  onSave() {
    this.dialogRef.close(this.updatedConfig);
  }

  onCancel() {
    this.dialogRef.close();
  }
}