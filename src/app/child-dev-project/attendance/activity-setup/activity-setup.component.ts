import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { AttendanceService } from "../attendance.service";
import { Note } from "../../notes/model/note";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { RecurringActivity } from "../model/recurring-activity";
import { SessionService } from "../../../core/session/session-service/session.service";
import { NoteDetailsComponent } from "../../notes/note-details/note-details.component";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";
import { EventNote } from "../model/event-note";

@Component({
  selector: "app-activity-setup",
  templateUrl: "./activity-setup.component.html",
  styleUrls: ["./activity-setup.component.scss"],
})
export class ActivitySetupComponent implements OnInit {
  date = new Date();

  existingEvents: NoteForActivitySetup[] = [];

  selectedEvent: NoteForActivitySetup;
  @Output() eventSelected = new EventEmitter<Note>();

  allActivities: RecurringActivity[] = [];
  visibleActivities: RecurringActivity[] = [];

  constructor(
    private entityMapper: EntityMapperService,
    private attendanceService: AttendanceService,
    private sessionService: SessionService,
    private formDialog: FormDialogService
  ) {}

  async ngOnInit() {
    await this.initAvailableEvents();
  }

  private async initAvailableEvents() {
    this.existingEvents = await this.attendanceService.getEventsOnDate(
      this.date
    );
    await this.loadActivities();
    this.sortEvents();
  }

  private async loadActivities() {
    this.allActivities = await this.entityMapper.loadType<RecurringActivity>(
      RecurringActivity
    );
    this.visibleActivities = this.allActivities.filter(
      (a) =>
        a.assignedTo === this.sessionService.getCurrentUser().getId() ||
        a.assignedTo === ""
    );

    for (const activity of this.visibleActivities) {
      const newEvent = this.createEventForActivity(activity);
      if (newEvent) {
        this.existingEvents.push(newEvent);
      }
    }
  }

  showMore() {
    const additionalActivities = this.allActivities.filter(
      (a) => !this.visibleActivities.includes(a)
    );
    for (const activity of additionalActivities) {
      const newEvent = this.createEventForActivity(activity);
      if (newEvent) {
        this.existingEvents.push(newEvent);
      }
      this.visibleActivities.push(activity);
    }
    this.sortEvents();
  }

  async setNewDate(date: Date) {
    this.date = date;

    await this.initAvailableEvents();

    if (!RecurringActivity.isActivityEventNote(this.selectedEvent)) {
      this.selectedEvent = null;
    }
  }

  private createEventForActivity(
    activity: RecurringActivity
  ): NoteForActivitySetup {
    if (this.existingEvents.find((e) => e.relatesTo === activity._id)) {
      return undefined;
    }

    const event = EventNote.createEventForActivity(
      activity,
      this.date
    ) as NoteForActivitySetup;
    event.author = this.sessionService.getCurrentUser().getId();
    event.isNewFromActivity = true;
    return event;
  }

  private sortEvents() {
    const calculateEventPriority = (event: Note) => {
      if (!RecurringActivity.isActivityEventNote(event)) {
        return 0;
      }

      let score = 1;
      const activity = this.allActivities.find(
        (a) => a._id === event.relatesTo
      );
      if (
        activity.assignedTo === this.sessionService.getCurrentUser().getId()
      ) {
        score += 1;
      } else if (activity.assignedTo !== "") {
        score -= 2;
      }

      return score;
    };

    this.existingEvents = this.existingEvents.sort(
      (a, b) => calculateEventPriority(b) - calculateEventPriority(a)
    );
  }

  createOneTimeEvent() {
    const newNote = Note.create(new Date());
    newNote.author = this.sessionService.getCurrentUser().name;

    this.formDialog
      .openDialog(NoteDetailsComponent, newNote)
      .afterClosed()
      .subscribe((createdNote: Note) => {
        if (createdNote) {
          this.existingEvents.push(createdNote);
          this.selectedEvent = createdNote;
        }
      });
  }
}

type NoteForActivitySetup = Note & { isNewFromActivity?: boolean };
