import { AfterViewInit, Component, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Child } from "../../../children/model/child";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { AttendanceService } from "../../attendance.service";
import { EventAttendance } from "../../model/event-attendance";
import { ActivityAttendance } from "../../model/activity-attendance";
import { RecurringActivity } from "../../model/recurring-activity";
import moment, { Moment } from "moment";
import { groupBy } from "../../../../utils/utils";
import { MatTableModule } from "@angular/material/table";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { NgForOf, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../../../core/basic-datatypes/entity/display-entity/display-entity.component";

import { AttendanceDayBlockComponent } from "./attendance-day-block/attendance-day-block.component";

import { DashboardWidget } from "../../../../core/dashboard/dashboard-widget/dashboard-widget";
import { EventNote } from "../../model/event-note";
import { DashboardListWidgetComponent } from "../../../../core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { WidgetContentComponent } from "../../../../core/dashboard/dashboard-widget/widget-content/widget-content.component";

interface AttendanceWeekRow {
  childId: string;
  activity: RecurringActivity;
  attendanceDays: (EventAttendance | undefined)[];
}

@DynamicComponent("AttendanceWeekDashboard")
@Component({
  selector: "app-attendance-week-dashboard",
  templateUrl: "./attendance-week-dashboard.component.html",
  styleUrls: ["./attendance-week-dashboard.component.scss"],
  standalone: true,
  imports: [
    NgIf,
    MatTableModule,
    NgForOf,
    DisplayEntityComponent,
    AttendanceDayBlockComponent,
    DashboardListWidgetComponent,
    WidgetContentComponent,
  ],
})
export class AttendanceWeekDashboardComponent
  extends DashboardWidget
  implements OnInit, AfterViewInit
{
  static getRequiredEntities() {
    return EventNote.ENTITY_TYPE;
  }

  /**
   * The offset from the default time period, which is the last complete week.
   *
   * For example:
   * If you set the offset of 0, the widget displays attendance for the last completed week (i.e. ending last Saturday).
   * If you set the offset to 7 and today is Thursday, the widget displays attendance from the Monday 3 days ago
   * (i.e. the current running week).
   */
  @Input() daysOffset = 0;

  /**
   * description displayed to users for what this widget is analysing
   * e.g. "Absences this week"
   */
  @Input() label: string;

  @Input() periodLabel: string;

  /**
   * Only participants who were absent more than this threshold are counted and shown in the dashboard.
   *
   * The default is 1.
   * That means if someone was absent two or more days within a specific activity in the given week
   * the person will be counted and displayed as a critical case in this dashboard widget.
   */
  @Input() absentWarningThreshold: number = 1;

  /**
   * The special attendance status type for which this widget should filter.
   *
   * (Optional) If this is not set, all status types that are counted as logically "ABSENT" are considered.
   */
  @Input() attendanceStatusType: string;

  entries: AttendanceWeekRow[][];

  constructor(
    private attendanceService: AttendanceService,
    private router: Router,
  ) {
    super();
  }
  ngAfterViewInit(): void {
    throw new Error("Method not implemented.");
  }

  ngOnInit() {
    if (this.periodLabel && !this.label) {
      this.label = $localize`:Dashboard attendance component subtitle:Absences ${this.periodLabel}`;
    }
    return this.loadAttendanceOfAbsentees();
  }

  private async loadAttendanceOfAbsentees() {
    const previousMonday = moment()
      .startOf("isoWeek")
      .subtract(1, "week")
      .add(this.daysOffset, "days");
    const previousSaturday = moment(previousMonday).add(5, "days");

    const activityAttendances =
      await this.attendanceService.getAllActivityAttendancesForPeriod(
        previousMonday.toDate(),
        previousSaturday.toDate(),
      );
    const lowAttendanceCases = new Set<string>();
    const records: AttendanceWeekRow[] = [];
    for (const att of activityAttendances) {
      const rows = this.generateRowsFromActivityAttendance(
        att,
        moment(previousMonday),
        moment(previousSaturday),
      );
      records.push(...rows);

      rows
        .filter((r) => this.filterLowAttendance(r))
        .forEach((r) => lowAttendanceCases.add(r.childId));
    }

    const groups = groupBy(records, "childId");
    this.entries = groups
      .filter(([childId]) => lowAttendanceCases.has(childId))
      .map(([_, attendance]) => attendance);
  }

  private generateRowsFromActivityAttendance(
    att: ActivityAttendance,
    from: Moment,
    to: Moment,
  ): AttendanceWeekRow[] {
    if (!att.activity) {
      return [];
    }

    const results: AttendanceWeekRow[] = [];
    for (const participant of att.activity.participants) {
      const eventAttendances = [];

      let day = moment(from);
      while (day.isSameOrBefore(to, "day")) {
        const event = att.events.find((e) => day.isSame(e.date, "day"));
        if (event) {
          eventAttendances.push(event.getAttendance(participant));
        } else {
          // put a "placeholder" into the array for the current day
          eventAttendances.push(undefined);
        }
        day = day.add(1, "day");
      }

      results.push({
        childId: participant,
        activity: att.activity,
        attendanceDays: eventAttendances,
      });
    }

    return results;
  }

  private filterLowAttendance(row: AttendanceWeekRow): boolean {
    let countAbsences = 0;
    if (!this.attendanceStatusType) {
      countAbsences = row.attendanceDays.filter(
        (e) => e?.status?.countAs === AttendanceLogicalStatus.ABSENT,
      ).length;
    } else {
      countAbsences = row.attendanceDays.filter(
        (e) => e?.status?.id === this.attendanceStatusType,
      ).length;
    }

    return countAbsences > this.absentWarningThreshold;
  }

  goToChild(childId: string) {
    this.router.navigate([Child.route, childId]);
  }
}
