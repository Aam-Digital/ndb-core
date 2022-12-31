import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Child } from "../../../children/model/child";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { AttendanceService } from "../../attendance.service";
import { EventAttendance } from "../../model/event-attendance";
import { ActivityAttendance } from "../../model/activity-attendance";
import { RecurringActivity } from "../../model/recurring-activity";
import moment, { Moment } from "moment";
import { groupBy } from "../../../../utils/utils";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { DashboardModule } from "../../../../core/dashboard/dashboard.module";
import { NgForOf, NgIf } from "@angular/common";
import { EntitySelectModule } from "../../../../core/entity-components/entity-select/entity-select.module";
import { AttendanceModule } from "../../attendance.module";

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
  imports: [
    DashboardModule,
    NgIf,
    MatTableModule,
    EntitySelectModule,
    NgForOf,
    MatPaginatorModule,
    AttendanceModule,
  ],
  standalone: true,
})
export class AttendanceWeekDashboardComponent
  implements OnInitDynamicComponent, OnInit, AfterViewInit
{
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

  @ViewChild("paginator") paginator: MatPaginator;
  tableDataSource = new MatTableDataSource<AttendanceWeekRow[]>();

  loadingDone = false;

  constructor(
    private attendanceService: AttendanceService,
    private router: Router
  ) {}

  onInitFromDynamicConfig(config: any) {
    if (config?.daysOffset) {
      this.daysOffset = config.daysOffset;
    }
    if (config?.periodLabel) {
      this.label = $localize`:Dashboard attendance component subtitle:Absences ${config.periodLabel}`;
    }
    if (config?.label) {
      this.label = config.label;
    }
    if (config?.attendanceStatusType) {
      this.attendanceStatusType = config.attendanceStatusType;
    }
  }

  async ngOnInit() {
    await this.loadAttendanceOfAbsentees();
  }

  async loadAttendanceOfAbsentees() {
    const today = new Date();
    const previousMonday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay() - 6 + this.daysOffset
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
    this.tableDataSource.data = Array.from(lowAttendanceCases.values()).map(
      (childId) => groupedRecords.get(childId)
    );
    this.loadingDone = true;
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
    let countAbsences = 0;
    if (!this.attendanceStatusType) {
      countAbsences = row.attendanceDays.filter(
        (e) => e?.status?.countAs === AttendanceLogicalStatus.ABSENT
      ).length;
    } else {
      countAbsences = row.attendanceDays.filter(
        (e) => e?.status?.id === this.attendanceStatusType
      ).length;
    }

    return countAbsences > this.absentWarningThreshold;
  }

  goToChild(childId: string) {
    this.router.navigate([Child.route, childId]);
  }

  ngAfterViewInit() {
    this.tableDataSource.paginator = this.paginator;
  }
}
