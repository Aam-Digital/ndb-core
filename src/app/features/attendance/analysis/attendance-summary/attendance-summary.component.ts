import { Component, Input } from "@angular/core";
import { ActivityAttendance } from "../../model/activity-attendance";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { CustomDatePipe } from "#src/app/core/basic-datatypes/date/custom-date.pipe";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";

/**
 * Short overall attendance statistics of all events within a given activity, beyond a fixed monthly period.
 */
@Component({
  selector: "app-attendance-summary",
  templateUrl: "./attendance-summary.component.html",
  styleUrls: ["./attendance-summary.component.scss"],
  imports: [CustomDatePipe, DynamicComponentDirective],
})
export class AttendanceSummaryComponent {
  @Input() attendance: ActivityAttendance;
  @Input() forChild: string;

  @Input() set columns(value: FormFieldConfig[]) {
    this._columns = value
      // hide periodFrom / periodTo as it is displayed in custom styling directly in the template
      .filter((col) => !["periodFrom", "periodTo"].includes(col.id))
      // start with most summative column, usually displayed right-most in table
      .reverse();
  }

  _columns: FormFieldConfig[] = [];
}
