import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { Note } from "../../notes/model/note";
import { MatCalendarCellCssClasses } from "@angular/material/datepicker/calendar-body";
import moment, { Moment } from "moment";
import { EventAttendance } from "../model/event-attendance";
import { MatCalendar } from "@angular/material/datepicker";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { NoteDetailsComponent } from "../../notes/note-details/note-details.component";
import {
  AverageAttendanceStats,
  calculateAverageAttendance,
} from "../model/calculate-average-event-attendance";
import { EventNote } from "../model/event-note";
import { RecurringActivity } from "../model/recurring-activity";
import { applyUpdate } from "../../../core/entity/entity-update";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@Component({
  selector: "app-attendance-calendar",
  templateUrl: "./attendance-calendar.component.html",
  styleUrls: ["./attendance-calendar.component.scss"],
})
@UntilDestroy()
export class AttendanceCalendarComponent implements OnChanges {
  @Input() records: Note[] = [];
  @Input() highlightForChild: string;
  @Input() activity: RecurringActivity;

  @ViewChild(MatCalendar) calendar: MatCalendar<Date>;
  minDate: Date;
  maxDate: Date;

  selectedDate: moment.Moment;
  selectedEvent: Note;
  selectedEventAttendance: EventAttendance;
  selectedEventAttendanceOriginal: EventAttendance;
  selectedEventStats: AverageAttendanceStats;

  constructor(
    private entityMapper: EntityMapperService,
    private formDialog: FormDialogService
  ) {
    this.entityMapper
      .receiveUpdates(EventNote)
      .pipe(untilDestroyed(this))
      .subscribe((newNotes) => {
        this.records = applyUpdate(this.records, newNotes);
        this.selectDay(this.selectedDate.toDate());
      });
  }

  highlightDate = (cellDate: Date): MatCalendarCellCssClasses => {
    const cellMoment = moment(cellDate);
    const classes = {
      "attendance-calendar-date-general": true,
    };

    if (this.selectedDate) {
      classes["attendance-calendar-date-selected"] = cellMoment.isSame(
        this.selectedDate,
        "day"
      );
    }

    const event = this.records.find((e) => cellMoment.isSame(e.date, "day"));
    if (event && this.highlightForChild) {
      // coloring for individual child
      const eventAttendance = event.getAttendance(this.highlightForChild);

      const statusClass = eventAttendance?.status?.style;
      classes[statusClass] = true;

      classes["attendance-calendar-date-has-remarks"] =
        eventAttendance?.remarks && eventAttendance?.remarks !== "";
    }

    if (event && !this.highlightForChild) {
      // coloring based on averages across all children
      const stats = calculateAverageAttendance(event);

      const percentageSlab = Math.round(stats.average * 10) * 10;
      classes["w-" + percentageSlab] = true;

      classes["attendance-calendar-date-has-participants-with-unknown-status"] =
        stats.excludedUnknown > 0;
    }

    return classes;
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("records")) {
      this.updateDateRange();
    }
  }

  /**
   * restrict period available for user navigation to the months for which events are given
   * @private
   */
  private updateDateRange() {
    const dates: Moment[] = this.records.map((e) => moment(e.date));
    this.minDate = moment.min(dates).startOf("month").toDate();
    this.maxDate = moment.max(dates).endOf("month").toDate();

    if (this.calendar) {
      // it is only possible to update the active date (i.e. which month is visible)
      // after minDate is propagated with the next change cycle ...
      setTimeout(() => (this.calendar.activeDate = this.minDate));
    }
  }

  get hasAverage(): boolean {
    return !isNaN(this.selectedEventStats.average);
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
        this.selectedDate.isSame(e.date, "day")
      );
      this.selectedEventAttendance = this.selectedEvent?.getAttendance(
        this.highlightForChild
      );
      // clone attendance information to allow detecting and reverting changes
      this.selectedEventAttendanceOriginal = Object.assign(
        {},
        this.selectedEventAttendanceOriginal
      );
      if (this.selectedEvent) {
        this.selectedEventStats = calculateAverageAttendance(
          this.selectedEvent
        );
      }
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

    await this.entityMapper.save(this.selectedEvent);
  }

  newNote(): EventNote {
    const note = new EventNote();
    note.date = this.selectedDate.toDate();
    note.children = this.activity.participants;
    note.authors = this.activity.assignedTo;
    note.category = this.activity.type;
    note.subject = this.activity.title;
    return note;
  }

  showEventDetails(selectedEvent: Note) {
    this.formDialog.openDialog(NoteDetailsComponent, selectedEvent);
  }
}
