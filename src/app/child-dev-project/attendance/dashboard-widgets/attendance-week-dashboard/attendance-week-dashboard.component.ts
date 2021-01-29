import { Component, Input, OnInit } from "@angular/core";
import { ChildrenService } from "../../../children/children.service";
import { UntilDestroy } from "@ngneat/until-destroy";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
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
  implements OnInitDynamicComponent, OnInit {
  @Input() daysOffset: number;
  @Input() periodLabel: string;

  dashboardRowGroups: AttendanceWeekRow[][];

  constructor(
    private childrenService: ChildrenService,
    private attendanceService: AttendanceService
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

    const activityAttendances = await this.attendanceService.getAllActivityAttendancesForPeriod(
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
    this.dashboardRowGroups = Array.from(
      lowAttendanceCases.values()
    ).map((childId) => groupedRecords.get(childId));
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

    return countAbsences > 1;
  }
}
