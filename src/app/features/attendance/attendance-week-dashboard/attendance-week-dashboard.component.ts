import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
} from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import moment, { Moment } from "moment";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { DashboardListWidgetComponent } from "#src/app/core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { AttendanceService } from "../attendance.service";
import { AttendanceDayBlockComponent } from "./attendance-day-block/attendance-day-block.component";
import { AttendanceItem } from "../model/attendance-item";
import { EventWithAttendance } from "../model/event-with-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";

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
export class AttendanceWeekDashboardComponent {
  private readonly attendanceService = inject(AttendanceService);

  /**
   * The offset from the default time period, which is the last complete week.
   *
   * For example:
   * If you set the offset of 0, the widget displays attendance for the last completed week (i.e. ending last Saturday).
   * If you set the offset to 7 and today is Thursday, the widget displays attendance from the Monday 3 days ago
   * (i.e. the current running week).
   */
  daysOffset = input(0);

  /**
   * description displayed to users for what this widget is analysing
   * e.g. "Absences this week"
   */
  label = input<string>();

  periodLabel = input<string>();

  /**
   * Only participants who were absent more than this threshold are counted and shown in the dashboard.
   *
   * The default is 1.
   * That means if someone was absent two or more days within a specific activity in the given week
   * the person will be counted and displayed as a critical case in this dashboard widget.
   */
  absentWarningThreshold = input(1);

  /**
   * The special attendance status type for which this widget should filter.
   *
   * (Optional) If this is not set, all status types that are counted as logically "ABSENT" are considered.
   */
  attendanceStatusType = input<string>();

  subtitle = computed(() => {
    const label = this.label();
    if (label) {
      return label;
    }

    const periodLabel = this.periodLabel();
    if (periodLabel) {
      return $localize`:Dashboard attendance component subtitle:Absences ${periodLabel}`;
    }

    return undefined;
  });

  entries = resource({
    params: () => ({
      daysOffset: this.daysOffset(),
      absentWarningThreshold: this.absentWarningThreshold(),
      attendanceStatusType: this.attendanceStatusType(),
    }),
    loader: async ({ params }) => {
      const { from, to } = this.getWeekDateRange(params.daysOffset);
      const rawEvents = await this.attendanceService.getEventsOnDate(
        from.toDate(),
        to.toDate(),
      );

      const groupedByActivity = this.groupEventsByActivity(rawEvents);

      const lowAttendanceCases = new Set<string>();
      const allRows: AttendanceWeekRow[] = [];
      for (const [activityId, activityEvents] of groupedByActivity) {
        const rows = this.generateRowsFromEvents(
          activityEvents,
          from,
          to,
          activityId,
        );
        allRows.push(...rows);
        rows
          .filter((row) =>
            this.filterLowAttendance(
              row,
              params.absentWarningThreshold,
              params.attendanceStatusType,
            ),
          )
          .forEach((row) => lowAttendanceCases.add(row.participantId));
      }

      return Array.from(this.groupRowsByParticipant(allRows).entries())
        .filter(([participantId]) => lowAttendanceCases.has(participantId))
        .map(([_, attendance]) => attendance);
    },
  });

  private getWeekDateRange(daysOffset: number): { from: Moment; to: Moment } {
    const from = moment()
      .startOf("isoWeek")
      .subtract(1, "week")
      .add(daysOffset, "days");
    const to = moment(from).add(5, "days");
    return { from, to };
  }

  /**
   * Wraps raw event entities and groups them by activity.
   * Standalone events (without a linked activity) are grouped under `undefined`
   * so they appear as a combined row in the dashboard.
   */
  private groupEventsByActivity(
    rawEvents: Entity[],
  ): Map<string | undefined, EventWithAttendance[]> {
    const grouped = new Map<string | undefined, EventWithAttendance[]>();
    for (const event of rawEvents) {
      const wrappedEvent = this.attendanceService.wrapEventEntity(event);
      const existing = grouped.get(wrappedEvent.activityId) ?? [];
      existing.push(wrappedEvent);
      grouped.set(wrappedEvent.activityId, existing);
    }
    return grouped;
  }

  private groupRowsByParticipant(
    rows: AttendanceWeekRow[],
  ): Map<string, AttendanceWeekRow[]> {
    const grouped = new Map<string, AttendanceWeekRow[]>();
    for (const row of rows) {
      const existing = grouped.get(row.participantId) ?? [];
      existing.push(row);
      grouped.set(row.participantId, existing);
    }
    return grouped;
  }

  private generateRowsFromEvents(
    events: EventWithAttendance[],
    from: Moment,
    to: Moment,
    activityId: string | undefined,
  ): AttendanceWeekRow[] {
    return this.getUniqueParticipants(events).map((participantId) => ({
      participantId,
      activityId,
      attendanceDays: this.buildAttendanceDays(events, from, to, participantId),
    }));
  }

  private getUniqueParticipants(events: EventWithAttendance[]): string[] {
    return [
      ...new Set(
        events.flatMap((event) =>
          event.attendanceItems
            .map((item) => item.participant)
            .filter((p): p is string => !!p),
        ),
      ),
    ];
  }

  private buildAttendanceDays(
    events: EventWithAttendance[],
    from: Moment,
    to: Moment,
    participant: string,
  ): (AttendanceItem | undefined)[] {
    const days: (AttendanceItem | undefined)[] = [];
    let day = moment(from);
    while (day.isSameOrBefore(to, "day")) {
      days.push(this.getAttendanceOnDay(events, day, participant));
      day = day.add(1, "day");
    }
    return days;
  }

  /**
   * When multiple events overlap on the same day (e.g. grouped standalone events),
   * prefer the first event where the participant is marked absent.
   */
  private getAttendanceOnDay(
    events: EventWithAttendance[],
    day: Moment,
    participant: string,
  ): AttendanceItem | undefined {
    const eventsOnDay = events.filter((e) => day.isSame(e.date, "day"));
    const event =
      eventsOnDay.find(
        (e) =>
          e.getAttendanceForParticipant(participant)?.status?.countAs ===
          AttendanceLogicalStatus.ABSENT,
      ) ?? eventsOnDay[0];
    return event?.getAttendanceForParticipant(participant);
  }

  private filterLowAttendance(
    row: AttendanceWeekRow,
    absentWarningThreshold: number,
    attendanceStatusType: string | undefined,
  ): boolean {
    let countAbsences = 0;
    if (!attendanceStatusType) {
      countAbsences = row.attendanceDays.filter(
        (entry) => entry?.status?.countAs === AttendanceLogicalStatus.ABSENT,
      ).length;
    } else {
      countAbsences = row.attendanceDays.filter(
        (entry) => entry?.status?.id === attendanceStatusType,
      ).length;
    }

    return countAbsences > absentWarningThreshold;
  }
}
