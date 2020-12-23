import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { RecurringActivity } from "../model/recurring-activity";
import { AttendanceDetailsComponent } from "../attendance-details/attendance-details.component";
import { ColumnDescription } from "../../../core/entity-components/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { AttendanceService } from "../attendance.service";
import { DatePipe, PercentPipe } from "@angular/common";
import { ActivityAttendance } from "../model/activity-attendance";

@Component({
  selector: "app-activity-attendance-section",
  templateUrl: "./activity-attendance-section.component.html",
  styleUrls: ["./activity-attendance-section.component.scss"],
})
export class ActivityAttendanceSectionComponent
  implements OnChanges, OnInitDynamicComponent {
  @Input() activity: RecurringActivity;
  @Input() forChild?: string;

  records: ActivityAttendance[];

  detailsComponent = AttendanceDetailsComponent;
  columns: Array<ColumnDescription> = [
    new ColumnDescription(
      "periodFrom",
      "Month",
      ColumnDescriptionInputType.MONTH,
      null,
      (v: Date) => this.datePipe.transform(v, "yyyy-MM"),
      "xs"
    ),
    new ColumnDescription(
      "getEventsPresent",
      "Present",
      ColumnDescriptionInputType.FUNCTION,
      null,
      undefined,
      "xs"
    ),
    new ColumnDescription(
      "getEventsTotal",
      "Events",
      ColumnDescriptionInputType.FUNCTION,
      null,
      undefined,
      "xs"
    ),
    new ColumnDescription(
      "getAttendancePercentage",
      "Attended",
      ColumnDescriptionInputType.FUNCTION,
      null,
      (v: number) => this.percentPipe.transform(v, "1.0-0"),
      "md"
    ),
  ];

  constructor(
    private attendanceService: AttendanceService,
    private datePipe: DatePipe,
    private percentPipe: PercentPipe
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.hasOwnProperty("activity") ||
      changes.hasOwnProperty("forChild")
    ) {
      await this.init();
    }
  }

  async onInitFromDynamicConfig(config: any) {
    this.activity = config.entity as RecurringActivity;
    await this.init();
  }

  private async init() {
    this.records = await this.attendanceService.getActivityAttendances(
      this.activity
    );
    this.records.forEach((r) => (r.focusedChild = this.forChild));
  }
}
