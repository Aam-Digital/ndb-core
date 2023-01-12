import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "../model/attendance-status";
import { compareEnums } from "../../../utils/utils";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule } from "@angular/forms";
import { ConfigurableEnumDirective } from "../../../core/configurable-enum/configurable-enum-directive/configurable-enum.directive";

@Component({
  selector: "app-attendance-status-select",
  templateUrl: "./attendance-status-select.component.html",
  styleUrls: ["./attendance-status-select.component.scss"],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ConfigurableEnumDirective,
  ],
  standalone: true,
})
export class AttendanceStatusSelectComponent {
  @Input() value: AttendanceStatusType = NullAttendanceStatusType;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<AttendanceStatusType>();
  statusID = ATTENDANCE_STATUS_CONFIG_ID;
  compareFn = compareEnums;
}
