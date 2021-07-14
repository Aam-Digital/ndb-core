import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { RecurringActivity } from "../model/recurring-activity";
import { AttendanceDetailsComponent } from "../attendance-details/attendance-details.component";
import { AttendanceService } from "../attendance.service";
import { PercentPipe } from "@angular/common";
import { ActivityAttendance } from "../model/activity-attendance";
import { Note } from "../../notes/model/note";
import moment from "moment";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";

@Component({
  selector: "app-activity-attendance-section",
  templateUrl: "./activity-attendance-section.component.html",
  styleUrls: ["./activity-attendance-section.component.scss"],
})
export class ActivityAttendanceSectionComponent
  implements OnChanges, OnInitDynamicComponent
{
  @Input() activity: RecurringActivity;
  @Input() forChild?: string;

  records: ActivityAttendance[] = [];
  allRecords: ActivityAttendance[] = [];
  displayedEvents: Note[] = [];

  columns: FormFieldConfig[] = [
    {
      id: "periodFrom",
      label: "Month",
      view: "DisplayDate",
      additional: "YYYY-MM",
    },
    {
      id: "presentEvents",
      label: "Present",
      view: "ReadonlyFunction",
      additional: (e: ActivityAttendance) =>
        this.forChild
          ? e.countEventsPresent(this.forChild)
          : e.countEventsPresentAverage(true),
    },
    {
      id: "totalEvents",
      label: "Events",
      view: "ReadonlyFunction",
      additional: (e: ActivityAttendance) => e.countEventsTotal(),
    },
    {
      id: "attendancePercentage",
      label: "Attended",
      view: "ReadonlyFunction",
      additional: (e: ActivityAttendance) =>
        this.percentPipe.transform(
          this.forChild
            ? e.getAttendancePercentage(this.forChild)
            : e.getAttendancePercentageAverage(),
          "1.0-0"
        ),
    },
  ];

  constructor(
    private attendanceService: AttendanceService,
    private percentPipe: PercentPipe,
    private formDialog: FormDialogService
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

  async init(loadAll: boolean = false) {
    if (loadAll) {
      this.allRecords = await this.attendanceService.getActivityAttendances(
        this.activity
      );
    } else {
      this.allRecords = await this.attendanceService.getActivityAttendances(
        this.activity,
        moment().startOf("month").subtract(6, "months").toDate()
      );
    }
    this.updateDisplayedRecords(false);
  }

  updateDisplayedRecords(includeRecordsWithoutParticipation: boolean) {
    if (includeRecordsWithoutParticipation || !this.forChild) {
      this.records = this.allRecords;
    } else {
      this.records = this.allRecords.filter(
        (r) =>
          r.countEventsAbsent(this.forChild) +
            r.countEventsPresent(this.forChild) >
          0
      );
    }

    if (this.records?.length > 0) {
      this.records.sort(
        (a, b) => b.periodFrom.getTime() - a.periodFrom.getTime()
      );
      this.displayedEvents = this.records[0].events;
    }
  }

  showDetails(activity: ActivityAttendance) {
    this.formDialog.openDialog(AttendanceDetailsComponent, activity, {
      forChild: this.forChild,
    });
  }
}
