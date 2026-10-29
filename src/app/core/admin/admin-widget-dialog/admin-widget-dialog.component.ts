import {
  Component,
  inject,
  ChangeDetectionStrategy,
  Signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { FormControl, FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from "@angular/material/expansion";
import { TranslatableText } from "../../config/multi-lingual-config";
import { TranslatableTextInputComponent } from "../../config/translatable-text-input/translatable-text-input.component";
import { resolveLocaleText } from "../../language/active-locale";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-widget-dialog",
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    FormsModule,
    DynamicComponentDirective,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    TranslatableTextInputComponent,
  ],
  templateUrl: "./admin-widget-dialog.component.html",
  styleUrls: ["./admin-widget-dialog.component.scss"],
})
export class AdminWidgetDialogComponent {
  settingsComponentConfig: DynamicComponentConfig;
  widgetConfigForm: FormControl;
  /** tracked as a signal, because the settings component may change validity after this view was checked */
  widgetConfigInvalid: Signal<boolean>;

  /** raw values, so that translations into other languages are kept on save */
  commonConfig: {
    subtitle?: TranslatableText;
    explanation?: TranslatableText;
  } = {};

  dialogRef = inject(MatDialogRef<AdminWidgetDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as AdminWidgetDialogData;

  constructor() {
    this.commonConfig.subtitle = this.data.widgetConfig.config?.subtitle;
    this.commonConfig.explanation = this.data.widgetConfig.config?.explanation;

    this.widgetConfigForm = new FormControl(this.data.widgetConfig.config);
    this.widgetConfigInvalid = toSignal(
      this.widgetConfigForm.statusChanges.pipe(
        map((status) => status === "INVALID"),
      ),
      { initialValue: this.widgetConfigForm.invalid },
    );
    this.settingsComponentConfig = {
      component: this.data.settingsComponent,
      config: {
        formControl: this.widgetConfigForm,
      },
    };
  }

  prettifyTitle(componentName: string): string {
    return componentName.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  onSave() {
    if (this.widgetConfigForm.invalid) {
      return;
    }
    const config: Record<string, unknown> = {
      ...(this.widgetConfigForm.value ?? {}),
    };

    for (const key of ["subtitle", "explanation"] as const) {
      if (hasText(this.commonConfig[key])) {
        config[key] = this.commonConfig[key];
      } else {
        delete config[key];
      }
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

/** whether a plain or multi-lingual text has any non-blank text in some language */
function hasText(value: TranslatableText | undefined): boolean {
  const text = resolveLocaleText(value);
  return typeof text === "string" && text.trim().length > 0;
}
