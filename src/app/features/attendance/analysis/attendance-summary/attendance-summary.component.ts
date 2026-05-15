import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from "@angular/core";
import { ActivityAttendance } from "../../model/activity-attendance";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { CustomDatePipe } from "#src/app/core/basic-datatypes/date/custom-date.pipe";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";

/**
 * Short overall attendance statistics of all events within a given activity, beyond a fixed monthly period.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-attendance-summary",
  templateUrl: "./attendance-summary.component.html",
  styleUrls: ["./attendance-summary.component.scss"],
  imports: [CustomDatePipe, DynamicComponentDirective],
})
export class AttendanceSummaryComponent {
  attendance = input<ActivityAttendance>();
  forChild = input<string>();
  columns = input<FormFieldConfig[]>([]);

  readonly _columns = computed(() =>
    this.columns()
      // hide periodFrom / periodTo as it is displayed in custom styling directly in the template
      .filter((col) => !["periodFrom", "periodTo"].includes(col.id))
      // start with most summative column, usually displayed right-most in table
      .reverse(),
  );
}
