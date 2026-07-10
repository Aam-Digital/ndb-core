import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  resource,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FeatureDisabledInfoComponent } from "#src/app/core/common-components/feature-disabled-info/feature-disabled-info.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { SqlReportService } from "../sql-report/sql-report.service";

/**
 * Edit a report's `mode` as a dropdown of the supported modes
 * ("reporting", "exporting", "sql"), each with a tooltip explaining what it does.
 */
@DynamicComponent("EditReportMode")
@Component({
  selector: "app-edit-report-mode",
  templateUrl: "./edit-report-mode.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatTooltipModule,
    FeatureDisabledInfoComponent,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditReportModeComponent },
  ],
})
export class EditReportModeComponent
  extends CustomFormControlDirective<string>
  implements EditComponent
{
  private readonly sqlReportService = inject(SqlReportService);

  formFieldConfig = input<FormFieldConfig>();

  /**
   * Whether the server-side reporting backend required for "sql" reports is available.
   * Used to warn the user when they pick "sql" in an environment without the feature.
   */
  readonly reportingBackendEnabled = resource({
    loader: () => this.sqlReportService.isReportingBackendEnabled(),
  });

  readonly modeOptions: string[] = ["reporting", "exporting", "sql"];

  private readonly modeLabels: Record<string, string> = {
    reporting: $localize`:ReportConfig mode option:Reporting`,
    exporting: $localize`:ReportConfig mode option:Exporting`,
    sql: $localize`:ReportConfig mode option:SQL`,
  };

  /** short explanation of each mode, shown as a tooltip on the dropdown option */
  readonly modeDescriptions: Record<string, string> = {
    reporting: $localize`:ReportConfig mode description:Aggregated statistics (counts, groupings) calculated in the browser. No server-side reporting backend required.`,
    exporting: $localize`:ReportConfig mode description:A flat export of the matching records. No server-side reporting backend required.`,
    sql: $localize`:ReportConfig mode description:Custom server-side SQL queries for advanced reports. Requires the reporting backend to be enabled.`,
  };

  readonly modeToString = (mode: string): string =>
    this.modeLabels[mode] ?? mode;
}
