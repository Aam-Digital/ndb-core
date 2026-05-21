import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  ViewEncapsulation,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule, FormsModule } from "@angular/forms";
import { Entity } from "#src/app/core/entity/model/entity";
import {
  MatCalendar,
  MatCalendarCellCssClasses,
  MatDatepickerModule,
} from "@angular/material/datepicker";
import moment from "moment";
import { AttendanceItem } from "../../model/attendance-item";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "../../model/attendance-status";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
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
export class AttendanceCalendarComponent {
  private entityMapper = inject(EntityMapperService);
  private formDialog = inject(FormDialogService);
  private analyticsService = inject(AnalyticsService);
  private attendanceService = inject(AttendanceService);
  private readonly destroyRef = inject(DestroyRef);

  records = input<EventWithAttendance[]>([]);
  highlightForChild = input<string>();
  activity = input<Entity>();

  readonly calendar = viewChild<MatCalendar<Date>>(MatCalendar);

  private readonly _recordDates = computed(() =>
    this.records()
      .map((e) => e.date)
      .filter((d): d is Date => !!d)
      .map((d) => moment(d)),
  );
  minDate = computed<Date | undefined>(() => {
    const dates = this._recordDates();
    return dates.length > 0
      ? moment.min(dates).startOf("month").toDate()
      : undefined;
  });
  maxDate = computed<Date | undefined>(() => {
    const dates = this._recordDates();
    return dates.length > 0
      ? moment.max(dates).endOf("month").toDate()
      : undefined;
  });

  selectedDate = signal<moment.Moment | undefined>(undefined);
  selectedEvent = computed(() =>
    this.records().find((e) => this.selectedDate()?.isSame(e.date, "day")),
  );
  selectedEventStats = computed(() =>
    this.selectedEvent()?.getAttendanceStats(),
  );
  selectedEventAttendance = signal<AttendanceItem | undefined>(undefined);
  private selectedEventAttendanceOriginal: AttendanceItem | undefined;

  statusControl = new FormControl<ConfigurableEnumValue>(null);
  statusFieldConfig: FormFieldConfig = {
    id: "status",
    dataType: "configurable-enum",
    additional: ATTENDANCE_STATUS_CONFIG_ID,
  };

  constructor() {
    // Update calendar's visible month when date range changes
    effect(() => {
      const maxDate = this.maxDate();
      const calendar = this.calendar();
      if (calendar && maxDate) {
        calendar.activeDate = maxDate;
      }
    });

    // Sync attendance state when selected event or highlighted child changes
    effect(() => {
      const event = this.selectedEvent();
      const childId = this.highlightForChild();
      if (event && childId) {
        const attendance = untracked(() =>
          this.ensureParticipantInAttendance(event, childId),
        );
        this.selectedEventAttendance.set(attendance);
        this.selectedEventAttendanceOriginal = attendance.copy();
        this.statusControl.setValue(attendance.status ?? null, {
          emitEvent: false,
        });
      } else {
        this.selectedEventAttendance.set(undefined);
        this.selectedEventAttendanceOriginal = undefined;
        this.statusControl.setValue(null, { emitEvent: false });
      }
    });

    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        const attendance = this.selectedEventAttendance();
        if (attendance) {
          const normalizedStatus: AttendanceStatusType =
            (status as AttendanceStatusType) ?? NullAttendanceStatusType;
          const updatedAttendance = attendance.copy();
          updatedAttendance.status = normalizedStatus;
          this.selectedEventAttendance.set(updatedAttendance);
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

  selectedEventParticipantCount = computed(
    () => this.selectedEvent()?.attendanceItems.length ?? 0,
  );

  highlightDate = (cellDate: Date): MatCalendarCellCssClasses => {
    const cellMoment = moment(cellDate);
    const classes = {
      "attendance-calendar-date-general": true,
    };

    if (this.selectedDate()) {
      classes["attendance-calendar-date-selected"] = cellMoment.isSame(
        this.selectedDate(),
        "day",
      );
    }

    const event = this.records().find((e) => cellMoment.isSame(e.date, "day"));
    if (event && this.highlightForChild()) {
      // coloring for individual child
      const eventAttendance = event.getAttendanceForParticipant(
        this.highlightForChild(),
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

    if (event && !this.highlightForChild()) {
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

  hasAverage = computed(() => {
    return !Number.isNaN(this.selectedEventStats()?.average);
  });

  selectDay(newDate?: Date) {
    this.selectedDate.set(newDate ? moment(newDate) : undefined);

    if (newDate) {
      this.analyticsService.eventTrack("calendar_select_date", {
        category: "Attendance",
        label: this.selectedEvent() ? "with event" : "without event",
      });
    }

    this.calendar()?.updateTodaysDate();
  }

  async save() {
    const attendance = this.selectedEventAttendance();
    const original = this.selectedEventAttendanceOriginal;
    if (
      attendance?.status === original?.status &&
      attendance?.remarks === original?.remarks
    ) {
      // don't write unchanged object
      return;
    }

    await this.entityMapper.save(this.selectedEvent().entity);

    this.analyticsService.eventTrack("calendar_save_event_changes", {
      category: "Attendance",
    });
  }

  onRemarksChange(remarks: string) {
    const att = this.selectedEventAttendance();
    if (!att) return;
    const updatedAttendance = att.copy();
    updatedAttendance.remarks = remarks;
    this.selectedEventAttendance.set(updatedAttendance);
  }

  createNewEvent() {
    const activity = this.activity();
    if (!activity) {
      return;
    }
    this.attendanceService
      .createEventForActivity(activity, this.selectedDate().toDate())
      .then((note) => {
        this.formDialog.openView(note.entity);
      });
  }

  showEventDetails(selectedEvent: EventWithAttendance) {
    this.formDialog.openView(selectedEvent.entity);
  }
}
