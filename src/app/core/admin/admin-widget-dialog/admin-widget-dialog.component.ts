import { Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { FormControl, FormsModule } from "@angular/forms";
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
  widgetConfigForm: FormControl;

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

    this.widgetConfigForm = new FormControl(this.data.widgetConfig.config);
    this.settingsComponentConfig = {
      component: this.data.settingsComponent,
      config: {
        formControl: this.widgetConfigForm,
      },
    };
  }

  onSave() {
    const updatedConfig = {
      ...this.data.widgetConfig,
      config: {
        ...(this.widgetConfigForm.value ?? {}),
        subtitle: this.commonConfig.subtitle,
        explanation: this.commonConfig.explanation,
      },
    };
    this.dialogRef.close(updatedConfig);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
