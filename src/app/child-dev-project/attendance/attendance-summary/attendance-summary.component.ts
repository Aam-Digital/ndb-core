import { Component, Input } from "@angular/core";
import { ActivityAttendance } from "../model/activity-attendance";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";

@Component({
  selector: "app-attendance-summary",
  templateUrl: "./attendance-summary.component.html",
  styleUrls: ["./attendance-summary.component.scss"],
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
