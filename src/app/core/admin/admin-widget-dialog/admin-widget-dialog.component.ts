import { Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";

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
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    DynamicComponentDirective,
  ],
  templateUrl: "./admin-widget-dialog.component.html",
  styleUrls: ["./admin-widget-dialog.component.scss"],
})
export class AdminWidgetDialogComponent {
  settingsComponentConfig: DynamicComponentConfig;
  updatedConfig: any;
  commonConfig = {
    subtitle: "",
    explanation: "",
  };

  dialogRef = inject(MatDialogRef<AdminWidgetDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as AdminWidgetDialogData;

  constructor() {
    this.commonConfig.subtitle = this.data.widgetConfig.config?.subtitle ?? "";
    this.commonConfig.explanation =
      this.data.widgetConfig.config?.explanation ?? "";

    this.settingsComponentConfig = {
      component: this.data.settingsComponent,
      config: this.data.widgetConfig.config || {},
    };

    this.updatedConfig = { ...this.data.widgetConfig };
  }

  onConfigChange(newConfig: any) {
    this.updatedConfig = {
      ...this.updatedConfig,
      config: {
        ...this.updatedConfig.config,
        ...newConfig,
      },
    };
  }

  onSave() {
    this.updatedConfig = {
      ...this.updatedConfig,
      config: {
        ...this.updatedConfig.config,
        subtitle: this.commonConfig.subtitle,
        explanation: this.commonConfig.explanation,
      },
    };
    this.dialogRef.close(this.updatedConfig);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
