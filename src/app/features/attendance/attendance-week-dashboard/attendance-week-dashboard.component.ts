import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceService } from "../attendance.service";
import { AttendanceItem } from "../model/attendance-item";
import moment, { Moment } from "moment";
import { MatTableModule } from "@angular/material/table";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { AttendanceDayBlockComponent } from "./attendance-day-block/attendance-day-block.component";
import { DashboardWidget } from "#src/app/core/dashboard/dashboard-widget/dashboard-widget";
import { DashboardListWidgetComponent } from "#src/app/core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { EventWithAttendance } from "../model/event-with-attendance";

interface AttendanceWeekRow {
  participantId: string;
  activityId: string | undefined;
  attendanceDays: (AttendanceItem | undefined)[];
}

@DynamicComponent("AttendanceWeekDashboard")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-attendance-week-dashboard",
  templateUrl: "./attendance-week-dashboard.component.html",
  styleUrls: ["./attendance-week-dashboard.component.scss"],
  imports: [
    MatTableModule,
    EntityBlockComponent,
    AttendanceDayBlockComponent,
    DashboardListWidgetComponent,
  ],
})
export class AttendanceWeekDashboardComponent
  extends DashboardWidget
  implements OnInit
{
  private attendanceService = inject(AttendanceService);
  private readonly cdr = inject(ChangeDetectorRef);

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

    const rawEvents = await this.attendanceService.getEventsOnDate(
      previousMonday.toDate(),
      previousSaturday.toDate(),
    );

    // Standalone events (without a linked activity) are grouped together
    // under `undefined` so they appear as a combined row in the dashboard.
    // this means if multiple events are on one day, only one will be displayed
    const groupedByActivity = new Map<
      string | undefined,
      EventWithAttendance[]
    >();
    for (const e of rawEvents) {
      const ewa = this.attendanceService.wrapEventEntity(e);
      const key = ewa.activityId;
      const arr = groupedByActivity.get(key) ?? [];
      arr.push(ewa);
      groupedByActivity.set(key, arr);
    }

    const lowAttendanceCases = new Set<string>();
    const records: AttendanceWeekRow[] = [];
    for (const [activityId, activityEvents] of groupedByActivity) {
      const rows = this.generateRowsFromEvents(
        activityEvents,
        previousMonday,
        previousSaturday,
        activityId,
      );
      records.push(...rows);
      rows
        .filter((r) => this.filterLowAttendance(r))
        .forEach((r) => {
          lowAttendanceCases.add(r.participantId);
        });
    }

    const groupsMap = new Map<string, AttendanceWeekRow[]>();
    for (const r of records) {
      const arr = groupsMap.get(r.participantId) ?? [];
      arr.push(r);
      groupsMap.set(r.participantId, arr);
    }
    this.entries = Array.from(groupsMap.entries())
      .filter(([participantId]) => lowAttendanceCases.has(participantId))
      .map(([_, attendance]) => attendance);
    this.cdr.markForCheck();
  }

  private generateRowsFromEvents(
    events: EventWithAttendance[],
    from: Moment,
    to: Moment,
    activityId: string | undefined,
  ): AttendanceWeekRow[] {
    const participants = [
      ...new Set(
        events.flatMap((e) =>
          e.attendanceItems
            .map((item) => item.participant)
            .filter((p): p is string => !!p),
        ),
      ),
    ];

    const results: AttendanceWeekRow[] = [];
    for (const participant of participants) {
      const attendanceDays: (AttendanceItem | undefined)[] = [];

      let day = moment(from);
      while (day.isSameOrBefore(to, "day")) {
        const eventsOnDay = events.filter((e) => day.isSame(e.date, "day"));
        // When multiple events overlap on the same day (e.g. standalone events grouped together),
        // prefer the first event where the participant is marked absent.
        const event =
          eventsOnDay.find(
            (e) =>
              e.getAttendanceForParticipant(participant)?.status?.countAs ===
              AttendanceLogicalStatus.ABSENT,
          ) ?? eventsOnDay[0];
        // put a "placeholder" into the array if no event occurred on this day
        attendanceDays.push(
          event ? event.getAttendanceForParticipant(participant) : undefined,
        );
        day = day.add(1, "day");
      }

      results.push({ participantId: participant, activityId, attendanceDays });
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
}
