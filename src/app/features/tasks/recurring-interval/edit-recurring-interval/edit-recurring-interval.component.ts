import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../../../core/entity-components/entity-utils/dynamic-form-components/edit-component";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { TimeInterval } from "../time-interval";
import { MatDialog } from "@angular/material/dialog";
import { CustomIntervalComponent } from "../custom-interval/custom-interval.component";
import { MatOptionSelectionChange } from "@angular/material/core";

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
})
export class EditRecurringIntervalComponent
  extends EditComponent<any>
  implements OnInit
{
  predefinedIntervals: { label: string; interval: TimeInterval }[] = [
    {
      label: $localize`:default interval select option:weekly`,
      interval: { value: 1, unit: "week" },
    },
    {
      label: $localize`:default interval select option:monthly`,
      interval: { value: 1, unit: "month" },
    },
  ];

  compareOptionFun = (a: TimeInterval, b: TimeInterval) =>
    JSON.stringify(a) === JSON.stringify(b);

  constructor(private matDialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.predefinedIntervals = this.additional ?? this.predefinedIntervals;

    // re-create active custom interval if necessary
    this.setCustomInterval(this.formControl.value);
  }

  resetSelection() {
    this.formControl.setValue(undefined);
  }

  openCustomIntervalSelection($event: MatOptionSelectionChange<TimeInterval>) {
    if (!$event.isUserInput) {
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
          this.setCustomInterval(result);
        }
      });
  }

  private setCustomInterval(interval: TimeInterval) {
    if (!interval) {
      return;
    }

    const selectedOptionValue = this.predefinedIntervals.find((o) =>
      this.compareOptionFun(interval, o.interval)
    )?.interval;
    if (!selectedOptionValue) {
      this.predefinedIntervals.push({
        label: this.generateLabelFromInterval(interval),
        interval: interval,
      });
    }

    this.formControl.setValue(interval);
  }

  private generateLabelFromInterval(interval: TimeInterval) {
    // TODO: how to translate units? (probably same problem in date filters ...)
    return (
      " " +
      $localize`:custom interval select option:every ${interval.value} ${interval.unit}`
    );
  }
}
