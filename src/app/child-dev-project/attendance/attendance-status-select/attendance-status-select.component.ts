import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "../model/attendance-status";
import { compareEnums } from "../../../utils/utils";

@Component({
  selector: "app-attendance-status-select",
  templateUrl: "./attendance-status-select.component.html",
  styleUrls: ["./attendance-status-select.component.scss"],
})
export class AttendanceStatusSelectComponent {
  @Input() value: AttendanceStatusType = NullAttendanceStatusType;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<AttendanceStatusType>();
  statusID = ATTENDANCE_STATUS_CONFIG_ID;
  compareFn = compareEnums;
}
