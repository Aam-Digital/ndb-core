import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
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
export class AttendanceStatusSelectComponent implements OnInit, OnChanges {
  @Input() value: AttendanceStatusType = NullAttendanceStatusType;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<AttendanceStatusType>();

  statusValues: AttendanceStatusType[];
  statusID = ATTENDANCE_STATUS_CONFIG_ID;

  constructor(
    private configService: ConfigService,
    private changeDetection: ChangeDetectorRef
  ) {
    this.valueChange.subscribe((change) =>
      console.log("change", typeof this.value, change, this.value)
    );
  }

  ngOnInit() {
    console.log("before", typeof this.value);
    console.log("value", this.value.label.toLowerCase());
    this.statusValues = this.configService.getConfig<
      ConfigurableEnumConfig<AttendanceStatusType>
    >(CONFIGURABLE_ENUM_CONFIG_PREFIX + ATTENDANCE_STATUS_CONFIG_ID);
    console.log("statusValues", this.statusValues);
    this.changeDetection.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log("changes", changes, this.value.label.toLowerCase());
  }
  compareStatuses(a: AttendanceStatusType, b: AttendanceStatusType) {
    return a.id === b.id;
  }
}
