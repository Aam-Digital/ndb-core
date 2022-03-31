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
    this._columns = [this.displayFromDate, this.displayToDate].concat(
      value.filter((col) => !["periodFrom", "periodFrom"].includes(col.id))
    );
  }
  _columns: FormFieldConfig[] = [];

  private displayFromDate: FormFieldConfig = {
    id: "periodFrom",
    label: $localize`:The month from which the attendance summary is shown:From`,
    view: "DisplayDate",
    additional: "YYYY-MM",
  };
  private displayToDate: FormFieldConfig = {
    id: "periodTo",
    label: $localize`:The month to which the attendance summary is shown:To`,
    view: "DisplayDate",
    additional: "YYYY-MM",
  };
}
