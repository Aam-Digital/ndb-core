import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { AttendanceService } from "../attendance.service";
import { Note } from "../../notes/model/note";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { RecurringActivity } from "../model/recurring-activity";
import { SessionService } from "../../../core/session/session-service/session.service";
import { NoteDetailsComponent } from "../../notes/note-details/note-details.component";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";

@Component({
  selector: "app-activity-setup",
  templateUrl: "./activity-setup.component.html",
  styleUrls: ["./activity-setup.component.scss"],
})
export class ActivitySetupComponent implements OnInit {
  date = new Date();

  existingEvents: Note[] = [];

  selectedEvent: Note;
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
      this.existingEvents.push(this.createEventForActivity(activity));
    }
  }

  showMore() {
    const additionalActivities = this.allActivities.filter(
      (a) => !this.visibleActivities.includes(a)
    );
    for (const activity of additionalActivities) {
      this.existingEvents.push(this.createEventForActivity(activity));
      this.visibleActivities.push(activity);
    }
    this.sortEvents();
  }

  async setNewDate(date: Date) {
    this.date = date;

    await this.initAvailableEvents();

    if (!(this.selectedEvent?.relatesTo instanceof RecurringActivity)) {
      this.selectedEvent = null;
    }
  }

  private createEventForActivity(activity: RecurringActivity): Note {
    const alreadyCreated = this.existingEvents.find(
      (e) => e.relatesTo === activity
    );
    if (alreadyCreated) {
      return alreadyCreated;
    }

    const event = Note.create(this.date, activity.title);
    event.children = activity.participants;
    event.relatesTo = activity;
    return event;
  }

  private sortEvents() {
    const calculateEventPriority = (event: Note) => {
      if (!(event.relatesTo! instanceof RecurringActivity)) {
        return 0;
      }

      let score = 1;
      const activity = event.relatesTo as RecurringActivity;
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
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
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
