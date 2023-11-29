import { Component, Inject, Input, LOCALE_ID, OnInit } from "@angular/core";
import { RecurringActivity } from "../model/recurring-activity";
import { AttendanceDetailsComponent } from "../attendance-details/attendance-details.component";
import { AttendanceService } from "../attendance.service";
import { formatPercent, NgIf } from "@angular/common";
import { ActivityAttendance } from "../model/activity-attendance";
import moment from "moment";
import { FormFieldConfig } from "../../../core/common-components/entity-form/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { EntitySubrecordComponent } from "../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { AttendanceCalendarComponent } from "../attendance-calendar/attendance-calendar.component";
import { AttendanceSummaryComponent } from "../attendance-summary/attendance-summary.component";
import { MatDialog } from "@angular/material/dialog";

@DynamicComponent("ActivityAttendanceSection")
@Component({
  selector: "app-activity-attendance-section",
  templateUrl: "./activity-attendance-section.component.html",
  imports: [
    NgIf,
    MatProgressBarModule,
    EntitySubrecordComponent,
    MatSlideToggleModule,
    MatTooltipModule,
    MatButtonModule,
    AttendanceCalendarComponent,
    AttendanceSummaryComponent,
  ],
  standalone: true,
})
export class ActivityAttendanceSectionComponent implements OnInit {
  @Input() entity: RecurringActivity;
  @Input() forChild?: string;

  loading: boolean = true;
  records: ActivityAttendance[] = [];
  allRecords: ActivityAttendance[] = [];
  combinedAttendance: ActivityAttendance;

  columns: FormFieldConfig[] = [
    {
      id: "periodFrom",
      label: $localize`:The month something took place:Month`,
      viewComponent: "DisplayMonth",
    },
    {
      id: "presentEvents",
      label: $localize`:How many children are present at a meeting|Title of table column:Present`,
      viewComponent: "ReadonlyFunction",
      additional: (e: ActivityAttendance) =>
        this.forChild
          ? e.countEventsPresent(this.forChild)
          : e.countTotalPresent(),
    },
    {
      id: "totalEvents",
      label: $localize`:Events of an attendance:Events`,
      viewComponent: "ReadonlyFunction",
      additional: (e: ActivityAttendance) => e.countEventsTotal(),
    },
    {
      id: "attendancePercentage",
      label: $localize`:Percentage of people that attended an event:Attended`,
      viewComponent: "ReadonlyFunction",
      additional: (e: ActivityAttendance) =>
        formatPercent(
          this.forChild
            ? e.getAttendancePercentage(this.forChild)
            : e.getAttendancePercentageAverage(),
          this.locale,
          "1.0-0",
        ),
    },
  ];

  constructor(
    private attendanceService: AttendanceService,
    @Inject(LOCALE_ID) private locale: string,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    return this.init();
  }

  async init(loadAll: boolean = false) {
    this.loading = true;
    if (loadAll) {
      this.allRecords = await this.attendanceService.getActivityAttendances(
        this.entity,
      );
    } else {
      this.allRecords = await this.attendanceService.getActivityAttendances(
        this.entity,
        moment().startOf("month").subtract(6, "months").toDate(),
      );
    }
    this.updateDisplayedRecords(false);
    this.createCombinedAttendance();
    this.loading = false;
  }

  private createCombinedAttendance() {
    this.combinedAttendance = new ActivityAttendance();
    this.combinedAttendance.activity = this.entity;
    this.allRecords.forEach((record) => {
      this.combinedAttendance.events.push(...record.events);
      if (
        !this.combinedAttendance.periodFrom ||
        moment(record.periodFrom).isBefore(
          this.combinedAttendance.periodFrom,
          "day",
        )
      ) {
        this.combinedAttendance.periodFrom = record.periodFrom;
      }

      if (
        !this.combinedAttendance.periodTo ||
        moment(record.periodTo).isAfter(this.combinedAttendance.periodTo, "day")
      ) {
        this.combinedAttendance.periodTo = record.periodTo;
      }
    });
  }

  updateDisplayedRecords(includeRecordsWithoutParticipation: boolean) {
    if (includeRecordsWithoutParticipation || !this.forChild) {
      this.records = this.allRecords;
    } else {
      this.records = this.allRecords.filter(
        (r) =>
          r.countEventsAbsent(this.forChild) +
            r.countEventsPresent(this.forChild) >
          0,
      );
    }

    if (this.records?.length > 0) {
      this.records.sort(
        (a, b) => b.periodFrom.getTime() - a.periodFrom.getTime(),
      );
    }
  }

  showDetails(activity: ActivityAttendance) {
    this.dialog.open(AttendanceDetailsComponent, {
      data: {
        forChild: this.forChild,
        attendance: activity,
      },
    });
  }

  getBackgroundColor?: (rec: ActivityAttendance) => string = (
    rec: ActivityAttendance,
  ) => rec.getColor(this.forChild);
}
