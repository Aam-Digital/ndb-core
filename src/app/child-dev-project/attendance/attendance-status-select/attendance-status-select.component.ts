import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ConfigService } from "../../../core/config/config.service";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../../../core/configurable-enum/configurable-enum.interface";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "../model/attendance-status";

@Component({
  selector: "app-attendance-status-select",
  templateUrl: "./attendance-status-select.component.html",
  styleUrls: ["./attendance-status-select.component.scss"],
})
export class AttendanceStatusSelectComponent {
  @Input() value: AttendanceStatusType = NullAttendanceStatusType;
  @Output() valueChange = new EventEmitter<AttendanceStatusType>();

  statusValues: AttendanceStatusType[];

  constructor(private configService: ConfigService) {
    this.statusValues = this.configService.getConfig<
      ConfigurableEnumConfig<AttendanceStatusType>
    >(CONFIGURABLE_ENUM_CONFIG_PREFIX + ATTENDANCE_STATUS_CONFIG_ID);
  }
}
