import { Component, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Child } from "../../../children/model/child";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { AttendanceService } from "../../attendance.service";
import { EventAttendance } from "../../model/event-attendance";
import { ActivityAttendance } from "../../model/activity-attendance";
import { RecurringActivity } from "../../model/recurring-activity";
import moment, { Moment } from "moment";
import { groupBy } from "../../../../utils/utils";

interface AttendanceWeekRow {
  childId: string;
  activity: RecurringActivity;
  attendanceDays: (EventAttendance | undefined)[];
}

@UntilDestroy()
@Component({
  selector: "app-attendance-week-dashboard",
  templateUrl: "./attendance-week-dashboard.component.html",
  styleUrls: ["./attendance-week-dashboard.component.scss"],
})
export class AttendanceWeekDashboardComponent
  implements OnInitDynamicComponent, OnInit
{
  /**
   * The offset from the default time period, which is the last complete week.
   *
   * For example:
   * If you set the offset of 0, the widget displays attendance for the last completed week (i.e. ending last Saturday).
   * If you set the offset to 7 and today is Thursday, the widget displays attendance from the Monday 3 days ago
   * (i.e. the current running week).
   */
  @Input() daysOffset: number;

  /**
   * description displayed to users for the time period this widget is analysing
   * e.g. "this week" or "previous week"
   */
  @Input() periodLabel: string;

  /**
   * Only participants who were absent more then this threshold are counted and shown in the dashboard.
   *
   * The default is 1.
   * That means if someone was absent two or more days within a specific activity in the given week
   * the person will be counted and displayed as a critical case in this dashboard widget.
   */
  @Input() absentWarningThreshold: number = 1;

  dashboardRowGroups: AttendanceWeekRow[][];

  constructor(
    private attendanceService: AttendanceService,
    private router: Router
  ) {}

  onInitFromDynamicConfig(config: any) {
    if (config?.daysOffset) {
      this.daysOffset = config.daysOffset;
    }
    if (config?.periodLabel) {
      this.periodLabel = config.periodLabel;
    }
  }

  async ngOnInit() {
    await this.loadAttendanceOfAbsentees(this.daysOffset);
  }

  recordTrackByFunction = (index, item) => item.childId;

  async loadAttendanceOfAbsentees(daysOffset = 0) {
    const today = new Date();
    const previousMonday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay() - 6 + daysOffset
    );
    const previousSaturday = new Date(
      previousMonday.getFullYear(),
      previousMonday.getMonth(),
      previousMonday.getDate() + 5
    );

    const activityAttendances =
      await this.attendanceService.getAllActivityAttendancesForPeriod(
        previousMonday,
        previousSaturday
      );

    const lowAttendanceCases = new Set<string>();
    const records: AttendanceWeekRow[] = [];
    for (const att of activityAttendances) {
      const rows = this.generateRowsFromActivityAttendance(
        att,
        moment(previousMonday),
        moment(previousSaturday)
      );
      records.push(...rows);

      rows
        .filter((r) => this.filterLowAttendance(r))
        .forEach((r) => lowAttendanceCases.add(r.childId));
    }

    const groupedRecords = groupBy(records, "childId");
    this.dashboardRowGroups = Array.from(lowAttendanceCases.values()).map(
      (childId) => groupedRecords.get(childId)
    );
  }

  private generateRowsFromActivityAttendance(
    att: ActivityAttendance,
    from: Moment,
    to: Moment
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
    const countAbsences = row.attendanceDays.filter(
      (e) => e?.status?.countAs === AttendanceLogicalStatus.ABSENT
    ).length;

    return countAbsences > this.absentWarningThreshold;
  }

  goToChild(childId: string) {
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, childId]);
  }
}
