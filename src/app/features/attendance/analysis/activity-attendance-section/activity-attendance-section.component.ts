import {
  Component,
  ChangeDetectorRef,
  Input,
  LOCALE_ID,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
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
  ],
})
@UntilDestroy()
export class ActivityAttendanceSectionComponent implements OnInit, OnChanges {
  private attendanceService = inject(AttendanceService);
  private entityMapper = inject(EntityMapperService);
  private locale = inject(LOCALE_ID);
  private dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() entity: Entity;
  @Input() forChild?: string;

  loading: boolean = true;
  records: ActivityAttendance[] = [];
  entityCtr = ActivityAttendance;
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
      additional: (e: ActivityAttendance) => {
        const pct = this.forChild
          ? e.getAttendancePercentage(this.forChild)
          : e.getAttendancePercentageAverage();
        return pct !== undefined
          ? formatPercent(pct, this.locale, "1.0-0")
          : "-";
      },
    },
  ];

  ngOnInit() {
    this.subscribeToEventUpdates();
    return this.init();
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
        if (wrapped.activityId === this.entity?.getId()) {
          this.init();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entity) {
      this.init();
    }
  }

  async init(loadAll: boolean = false) {
    this.loading = true;
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
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
