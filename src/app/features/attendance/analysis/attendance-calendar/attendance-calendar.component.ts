import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule, FormsModule } from "@angular/forms";
import { Entity } from "#src/app/core/entity/model/entity";
import {
  MatCalendar,
  MatCalendarCellCssClasses,
  MatDatepickerModule,
} from "@angular/material/datepicker";
import moment, { Moment } from "moment";
import { AttendanceItem } from "../../model/attendance-item";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "../../model/attendance-status";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import type { AttendanceStats } from "../../model/event-with-attendance";
import { AttendanceService } from "../../attendance.service";
import { AnalyticsService } from "#src/app/core/analytics/analytics.service";
import { PercentPipe } from "@angular/common";
import { CustomDatePipe } from "#src/app/core/basic-datatypes/date/custom-date.pipe";
import { EditConfigurableEnumComponent } from "#src/app/core/basic-datatypes/configurable-enum/edit-configurable-enum/edit-configurable-enum.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { ConfigurableEnumValue } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EventWithAttendance } from "../../model/event-with-attendance";
import { Logging } from "#src/app/core/logging/logging.service";

/**
 * Displays a calendar view of attendance events for a given activity,
 * allowing drill-down into details and editing attendance for individual events.
 *
 * This component functions (almost) as a "display component"
 * and relies on inputs to receive data and updates.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-attendance-calendar",
  templateUrl: "./attendance-calendar.component.html",
  styleUrls: [
    "./attendance-calendar.component.scss",
    "../../../../core/common-components/dialog-close/dialog-close.component.scss",
  ],
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDatepickerModule,
    CustomDatePipe,
    EditConfigurableEnumComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    PercentPipe,
    MatButtonModule,
    Angulartics2Module,
    FontAwesomeModule,
  ],
})
export class AttendanceCalendarComponent implements OnChanges {
  private entityMapper = inject(EntityMapperService);
  private formDialog = inject(FormDialogService);
  private analyticsService = inject(AnalyticsService);
  private attendanceService = inject(AttendanceService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() records: EventWithAttendance[] = [];
  @Input() highlightForChild: string;
  @Input() activity: Entity;

  @ViewChild(MatCalendar) calendar: MatCalendar<Date>;
  minDate: Date;
  maxDate: Date;

  selectedDate: moment.Moment;
  selectedEvent: EventWithAttendance;
  selectedEventAttendance: AttendanceItem;
  selectedEventAttendanceOriginal: AttendanceItem;
  selectedEventStats: AttendanceStats;

  statusControl = new FormControl<ConfigurableEnumValue>(null);
  statusFieldConfig: FormFieldConfig = {
    id: "status",
    dataType: "configurable-enum",
    additional: ATTENDANCE_STATUS_CONFIG_ID,
  };

  constructor() {
    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        if (this.selectedEventAttendance) {
          const normalizedStatus: AttendanceStatusType =
            (status as AttendanceStatusType) ?? NullAttendanceStatusType;
          this.selectedEventAttendance.status = normalizedStatus;
          this.save().catch((error) =>
            Logging.warn("Could not save attendance status change", error),
          );
        }
      });
  }

  private ensureParticipantInAttendance(
    event: EventWithAttendance,
    participantId: string,
  ): AttendanceItem {
    let item = event.getAttendanceForParticipant(participantId);
    if (!item) {
      item = new AttendanceItem(NullAttendanceStatusType, "", participantId);
      event.attendanceItems = [...event.attendanceItems, item];
    }
    return item;
  }

  get selectedEventParticipantCount(): number {
    return this.selectedEvent ? this.selectedEvent.attendanceItems.length : 0;
  }

  highlightDate = (cellDate: Date): MatCalendarCellCssClasses => {
    const cellMoment = moment(cellDate);
    const classes = {
      "attendance-calendar-date-general": true,
    };

    if (this.selectedDate) {
      classes["attendance-calendar-date-selected"] = cellMoment.isSame(
        this.selectedDate,
        "day",
      );
    }

    const event = this.records.find((e) => cellMoment.isSame(e.date, "day"));
    if (event && this.highlightForChild) {
      // coloring for individual child
      const eventAttendance = event.getAttendanceForParticipant(
        this.highlightForChild,
      );

      if (!eventAttendance?.status?.id) {
        classes[
          "attendance-calendar-date-has-participants-with-unknown-status"
        ] = true;
      } else {
        classes["attendance-status-" + eventAttendance.status.id] = true;
      }

      classes["attendance-calendar-date-has-remarks"] =
        eventAttendance?.remarks && eventAttendance?.remarks !== "";
    }

    if (event && !this.highlightForChild) {
      // coloring based on averages across all children
      const stats = event.getAttendanceStats();

      if (isNaN(stats.average)) {
        classes["attendance-calendar-date-no-data"] = true;
      } else {
        const percentageSlab = Math.round(stats.average * 10) * 10;
        classes["w-" + percentageSlab] = true;
      }

      classes["attendance-calendar-date-has-participants-with-unknown-status"] =
        stats.excludedUnknown > 0;
    }

    return classes;
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("records")) {
      this.updateDateRange();
      if (this.selectedDate) {
        this.selectDay(this.selectedDate.toDate());
      }
    }
  }

  /**
   * restrict period available for user navigation to the months for which events are given
   * @private
   */
  private updateDateRange() {
    const dates: Moment[] = this.records
      .map((e) => e.date)
      .filter((d): d is Date => !!d)
      .map((d) => moment(d));
    if (dates.length === 0) {
      this.minDate = undefined;
      this.maxDate = undefined;
      return;
    }
    this.minDate = moment.min(dates).startOf("month").toDate();
    this.maxDate = moment.max(dates).endOf("month").toDate();

    if (this.calendar) {
      // it is only possible to update the active date (i.e. which month is visible)
      // to ensure the calendar initially displays the current month maxDate is propagated.
      setTimeout(() => (this.calendar.activeDate = this.maxDate));
    }
  }

  get hasAverage(): boolean {
    return !Number.isNaN(this.selectedEventStats.average);
  }

  selectDay(newDate?: Date) {
    if (!newDate) {
      this.selectedDate = undefined;
      this.selectedEvent = undefined;
      this.selectedEventAttendance = undefined;
      this.selectedEventAttendanceOriginal = undefined;
      this.selectedEventStats = undefined;
    } else {
      this.selectedDate = moment(newDate);
      this.selectedEvent = this.records.find((e) =>
        this.selectedDate.isSame(e.date, "day"),
      );
      if (this.selectedEvent && this.highlightForChild) {
        this.selectedEventAttendance = this.ensureParticipantInAttendance(
          this.selectedEvent,
          this.highlightForChild,
        );
        this.statusControl.setValue(
          this.selectedEventAttendance.status ?? null,
          { emitEvent: false },
        );
      }
      // clone attendance information to allow detecting and reverting changes
      this.selectedEventAttendanceOriginal = Object.assign(
        {},
        this.selectedEventAttendanceOriginal,
      );
      if (this.selectedEvent) {
        this.selectedEventStats = this.selectedEvent.getAttendanceStats();
      }

      this.analyticsService.eventTrack("calendar_select_date", {
        category: "Attendance",
        label: this.selectedEvent ? "with event" : "without event",
      });
    }

    this.calendar.updateTodaysDate();
  }

  async save() {
    if (
      this.selectedEventAttendance.status ===
        this.selectedEventAttendanceOriginal.status &&
      this.selectedEventAttendance.remarks ===
        this.selectedEventAttendanceOriginal.remarks
    ) {
      // don't write unchanged object
      return;
    }

    await this.entityMapper.save(this.selectedEvent.entity);

    this.analyticsService.eventTrack("calendar_save_event_changes", {
      category: "Attendance",
    });
  }

  createNewEvent() {
    this.attendanceService
      .createEventForActivity(this.activity, this.selectedDate.toDate())
      .then((note) => {
        this.formDialog.openView(note.entity);
      });
  }

  showEventDetails(selectedEvent: EventWithAttendance) {
    this.formDialog.openView(selectedEvent.entity);
  }
}
