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
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from "@angular/material/expansion";

export interface AdminWidgetDialogData {
  widgetConfig: DynamicComponentConfig;
  settingsComponent: string;
  title: string;
}

/**
 * Generic dashboard widget editing dialog
 * that also displays a custom component for the specific widget type.
 */
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
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
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
    const config: any = {
      ...(this.widgetConfigForm.value ?? {}),
    };

    if (this.commonConfig.subtitle?.trim()) {
      config.subtitle = this.commonConfig.subtitle;
    }
    if (this.commonConfig.explanation?.trim()) {
      config.explanation = this.commonConfig.explanation;
    }

    const updatedConfig = {
      ...this.data.widgetConfig,
      config,
    };
    this.dialogRef.close(updatedConfig);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
