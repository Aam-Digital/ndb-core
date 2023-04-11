import { Component } from "@angular/core";
import { EditComponent } from "../../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { generateLabelFromInterval, TimeInterval } from "../time-interval";
import { MatDialog } from "@angular/material/dialog";
import { CustomIntervalComponent } from "../custom-interval/custom-interval.component";
import { MatOptionSelectionChange } from "@angular/material/core";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSelectModule } from "@angular/material/select";
import { NgForOf, NgIf } from "@angular/common";

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
  standalone: true,
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatSelectModule,
    NgIf,
    NgForOf,
  ],
})
export class EditRecurringIntervalComponent extends EditComponent<any> {
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

  constructor(private matDialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.predefinedIntervals = this.additional ?? this.predefinedIntervals;

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
      this.compareOptionFun(interval, o.interval)
    )?.interval;
    if (!selectedOptionValue) {
      this.predefinedIntervals.push({
        label: generateLabelFromInterval(interval),
        interval: interval,
      });
    }
  }
}
