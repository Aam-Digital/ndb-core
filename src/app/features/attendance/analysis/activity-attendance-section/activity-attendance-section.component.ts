import {
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  linkedSignal,
  resource,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { AttendanceDetailsComponent } from "../attendance-details/attendance-details.component";
import { AttendanceService } from "../../attendance.service";
import { formatPercent } from "@angular/common";
import { ActivityAttendance } from "../../model/activity-attendance";
import moment from "moment";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { debounceTime, merge } from "rxjs";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { AttendanceCalendarComponent } from "../attendance-calendar/attendance-calendar.component";
import { AttendanceSummaryComponent } from "../attendance-summary/attendance-summary.component";
import { MatDialog } from "@angular/material/dialog";
import { EntitiesTableComponent } from "#src/app/core/common-components/entities-table/entities-table.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

/**
 * Displays attendance analysis for a given "recurring activity"
 * either related to a specific participant or the overall attendance.
 */
@DynamicComponent("ActivityAttendanceSection")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-activity-attendance-section",
  templateUrl: "./activity-attendance-section.component.html",
  imports: [
    MatProgressBarModule,
    EntitiesTableComponent,
    MatSlideToggleModule,
    MatTooltipModule,
    MatButtonModule,
    AttendanceCalendarComponent,
    AttendanceSummaryComponent,
    FaIconComponent,
  ],
})
@UntilDestroy()
export class ActivityAttendanceSectionComponent {
  private attendanceService = inject(AttendanceService);
  private entityMapper = inject(EntityMapperService);
  private locale = inject(LOCALE_ID);
  private dialog = inject(MatDialog);

  entity = input<Entity>();
  forChild = input<string>();

  /** Resets to false whenever entity changes; set to true by "Load all records" button. */
  loadAll = linkedSignal({
    source: () => this.entity()?.getId(),
    computation: () => false,
  });
  includeWithoutParticipation = signal(false);

  attendanceData = resource({
    params: () => ({ entity: this.entity(), loadAll: this.loadAll() }),
    loader: async ({ params: { entity, loadAll } }) => {
      const emptyResult = {
        records: [] as ActivityAttendance[],
        isFallbackToOlder: false,
        hasMoreRecords: false,
      };
      if (!entity) {
        return emptyResult;
      }
      if (loadAll) {
        return {
          ...emptyResult,
          records: await this.attendanceService.getActivityAttendances(entity),
        };
      }

      let from = moment().startOf("month").subtract(6, "months").toDate();
      let records = await this.attendanceService.getActivityAttendances(
        entity,
        from,
      );
      let isFallbackToOlder = false;

      if (records.length === 0) {
        // fall back to the most recent month with data (if any)
        const latestEventDate =
          await this.attendanceService.getLatestEventDate(entity);
        if (latestEventDate) {
          from = moment(latestEventDate).startOf("month").toDate();
          records = await this.attendanceService.getActivityAttendances(
            entity,
            from,
          );
          isFallbackToOlder = records.length > 0;
        }
      }

      return {
        records,
        isFallbackToOlder,
        hasMoreRecords: await this.hasRecordsBefore(entity, from),
      };
    },
  });

  /** Whether any events exist before the given date (i.e. more records can be loaded). */
  private async hasRecordsBefore(entity: Entity, date: Date) {
    const earliestEventDate =
      await this.attendanceService.getEarliestEventDate(entity);
    return (
      !!earliestEventDate && moment(earliestEventDate).isBefore(date, "day")
    );
  }

  private readonly allRecords = computed(
    () => this.attendanceData.value()?.records ?? [],
  );

  /** Whether older records are displayed because the default time range had none. */
  isFallbackToOlder = computed(
    () => this.attendanceData.value()?.isFallbackToOlder ?? false,
  );

  /** Whether events older than the currently displayed records exist and can be loaded. */
  hasMoreRecords = computed(
    () => this.attendanceData.value()?.hasMoreRecords ?? false,
  );

  entityCtr = ActivityAttendance;

  records = computed(() => {
    const forChild = this.forChild();
    let records: ActivityAttendance[];
    if (this.includeWithoutParticipation() || !forChild) {
      records = [...this.allRecords()];
    } else {
      records = this.allRecords().filter(
        (r) =>
          r.countEventsAbsent(forChild) + r.countEventsPresent(forChild) > 0,
      );
    }
    if (records?.length > 0) {
      records.sort((a, b) => b.periodFrom.getTime() - a.periodFrom.getTime());
    }
    return records;
  });

  combinedAttendance = computed(() => {
    const combined = new ActivityAttendance();
    combined.activity = this.entity();
    this.allRecords().forEach((record) => {
      combined.events.push(...record.events);
      if (
        !combined.periodFrom ||
        moment(record.periodFrom).isBefore(combined.periodFrom, "day")
      ) {
        combined.periodFrom = record.periodFrom;
      }
      if (
        !combined.periodTo ||
        moment(record.periodTo).isAfter(combined.periodTo, "day")
      ) {
        combined.periodTo = record.periodTo;
      }
    });
    return combined;
  });

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
        this.forChild()
          ? e.countEventsPresent(this.forChild())
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
      additional: (e: ActivityAttendance) => {
        const pct = this.forChild()
          ? e.getAttendancePercentage(this.forChild())
          : e.getAttendancePercentageAverage();
        return pct !== undefined
          ? formatPercent(pct, this.locale, "1.0-0")
          : "-";
      },
    },
  ];

  constructor() {
    this.subscribeToEventUpdates();
  }

  private subscribeToEventUpdates() {
    const eventTypes = this.attendanceService.eventTypes();
    if (eventTypes.length === 0) {
      return;
    }
    merge(...eventTypes.map((type) => this.entityMapper.receiveUpdates(type)))
      .pipe(debounceTime(500), untilDestroyed(this))
      .subscribe((update) => {
        const wrapped = this.attendanceService.wrapEventEntity(update.entity);
        if (wrapped.activityId === this.entity()?.getId()) {
          this.attendanceData.reload();
        }
      });
  }

  showDetails(activity: ActivityAttendance) {
    this.dialog.open(AttendanceDetailsComponent, {
      data: {
        forChild: this.forChild(),
        attendance: activity,
      },
    });
  }

  getBackgroundColor = computed(
    () => (rec: ActivityAttendance) => rec.getColor(this.forChild()),
  );
}
