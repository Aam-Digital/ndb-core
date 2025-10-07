import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatOptionSelectionChange } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../../core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { CustomIntervalComponent } from "../custom-interval/custom-interval.component";
import { generateLabelFromInterval, TimeInterval } from "../time-interval";

/**
 * Form field to edit a time interval for repetitions.
 *
 * The schema or config accepts pre-defined options for the dropdown as `additional`.
 */
@DynamicComponent("EditRecurringInterval")
@Component({
  selector: "app-edit-recurring-interval",
  templateUrl: "./edit-recurring-interval.component.html",
  styleUrls: ["./edit-recurring-interval.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatSelectModule,
  ],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditRecurringIntervalComponent,
    },
  ],
})
export class EditRecurringIntervalComponent
  extends CustomFormControlDirective<any>
  implements OnInit, EditComponent
{
  private matDialog = inject(MatDialog);

  @Input() formFieldConfig?: FormFieldConfig;

  predefinedIntervals: { label: string; interval: TimeInterval }[] = [
    {
      label: $localize`:default interval select option:weekly`,
      interval: { amount: 1, unit: "week" },
    },
    {
      label: $localize`:default interval select option:monthly`,
      interval: { amount: 1, unit: "month" },
    },
  ];

  compareOptionFun = (a: TimeInterval, b: TimeInterval) =>
    JSON.stringify(a) === JSON.stringify(b);

  get formControl(): FormControl<any> {
    return this.ngControl.control as FormControl<any>;
  }

  ngOnInit(): void {
    this.predefinedIntervals =
      this.formFieldConfig.additional ?? this.predefinedIntervals;

    // re-create active custom interval if necessary
    this.addCustomInterval(this.formControl.value);
  }

  resetSelection() {
    this.formControl.setValue(undefined);
  }

  openCustomIntervalSelection(event: MatOptionSelectionChange<TimeInterval>) {
    if (!event.isUserInput) {
      return;
    }

    const previousSelectedInterval = this.formControl.value;
    this.matDialog
      .open(CustomIntervalComponent)
      .afterClosed()
      .subscribe((result: TimeInterval) => {
        if (result === undefined) {
          // keep unchanged, i.e. revert to previous selection
          this.formControl.setValue(previousSelectedInterval);
        } else {
          this.addCustomInterval(result);
          this.formControl.setValue(result);
          this.formControl.markAsDirty();
        }
      });
  }

  private addCustomInterval(interval: TimeInterval) {
    if (!interval) {
      return;
    }

    const selectedOptionValue = this.predefinedIntervals.find((o) =>
      this.compareOptionFun(interval, o.interval),
    )?.interval;
    if (!selectedOptionValue) {
      this.predefinedIntervals.push({
        label: generateLabelFromInterval(interval),
        interval: interval,
      });
    }
  }
}
