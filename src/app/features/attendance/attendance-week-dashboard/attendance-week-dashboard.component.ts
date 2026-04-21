import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
    untracked,
} from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import moment, { Moment } from "moment";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { DashboardListWidgetComponent } from "#src/app/core/dashboard/dashboard-list-widget/dashboard-list-widget.component";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { Note } from "#src/app/child-dev-project/notes/model/note";
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
  private readonly entityMapper = inject(EntityMapperService);

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

  entries = signal<AttendanceWeekRow[][]>([]);

  constructor() {
    effect((onCleanup) => {
      // Track relevant inputs so this re-loads when widget config changes.
      this.daysOffset();
      this.absentWarningThreshold();
      this.attendanceStatusType();

      let isCurrent = true;
      untracked(() => {
        void this.loadAttendanceOfAbsentees(() => isCurrent);
      });

      const subscription = this.entityMapper
        .receiveUpdates(Note.ENTITY_TYPE)
        .subscribe(() => {
          void this.loadAttendanceOfAbsentees(() => isCurrent);
        });

      onCleanup(() => {
        isCurrent = false;
        subscription.unsubscribe();
      });
    });
  }

  private async loadAttendanceOfAbsentees(isCurrent: () => boolean) {
    const previousMonday = moment()
      .startOf("isoWeek")
      .subtract(1, "week")
      .add(this.daysOffset(), "days");
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
    for (const event of rawEvents) {
      const wrappedEvent = this.attendanceService.wrapEventEntity(event);
      const key = wrappedEvent.activityId;
      const eventsForKey = groupedByActivity.get(key) ?? [];
      eventsForKey.push(wrappedEvent);
      groupedByActivity.set(key, eventsForKey);
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
        .filter((row) => this.filterLowAttendance(row))
        .forEach((row) => {
          lowAttendanceCases.add(row.participantId);
        });
    }

    const groupsMap = new Map<string, AttendanceWeekRow[]>();
    for (const record of records) {
      const recordsForParticipant = groupsMap.get(record.participantId) ?? [];
      recordsForParticipant.push(record);
      groupsMap.set(record.participantId, recordsForParticipant);
    }

    const entries = Array.from(groupsMap.entries())
      .filter(([participantId]) => lowAttendanceCases.has(participantId))
      .map(([_, attendance]) => attendance);

    if (isCurrent()) {
      this.entries.set(entries);
    }
  }

  private generateRowsFromEvents(
    events: EventWithAttendance[],
    from: Moment,
    to: Moment,
    activityId: string | undefined,
  ): AttendanceWeekRow[] {
    const participants = [
      ...new Set(
        events.flatMap((event) =>
          event.attendanceItems
            .map((item) => item.participant)
            .filter((participant): participant is string => !!participant),
        ),
      ),
    ];

    const results: AttendanceWeekRow[] = [];
    for (const participant of participants) {
      const attendanceDays: (AttendanceItem | undefined)[] = [];

      let day = moment(from);
      while (day.isSameOrBefore(to, "day")) {
        const eventsOnDay = events.filter((event) =>
          day.isSame(event.date, "day"),
        );
        // When multiple events overlap on the same day (for example, grouped standalone events),
        // prefer the first event where the participant is marked absent.
        const event =
          eventsOnDay.find(
            (candidate) =>
              candidate.getAttendanceForParticipant(participant)?.status
                ?.countAs === AttendanceLogicalStatus.ABSENT,
          ) ?? eventsOnDay[0];

        // Put a placeholder into the array if no event occurred on this day.
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
    if (!this.attendanceStatusType()) {
      countAbsences = row.attendanceDays.filter(
        (entry) => entry?.status?.countAs === AttendanceLogicalStatus.ABSENT,
      ).length;
    } else {
      countAbsences = row.attendanceDays.filter(
        (entry) => entry?.status?.id === this.attendanceStatusType(),
      ).length;
    }

    return countAbsences > this.absentWarningThreshold();
  }
}
