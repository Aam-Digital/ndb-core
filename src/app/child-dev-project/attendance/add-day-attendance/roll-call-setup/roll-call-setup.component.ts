import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { AttendanceService } from "../../attendance.service";
import { Note } from "../../../notes/model/note";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { SessionService } from "../../../../core/session/session-service/session.service";
import { NoteDetailsComponent } from "../../../notes/note-details/note-details.component";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";

@Component({
  selector: "app-roll-call-setup",
  templateUrl: "./roll-call-setup.component.html",
  styleUrls: ["./roll-call-setup.component.scss"],
})
export class RollCallSetupComponent implements OnInit {
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

  public async loadActivities() {
    this.allActivities = await this.entityMapper.loadType<RecurringActivity>(
      RecurringActivity
    );

    this.visibleActivities = this.allActivities.filter((a) =>
      a.assignedTo.includes(this.sessionService.getCurrentUser().getId())
    );
    if (this.visibleActivities.length === 0) {
      this.visibleActivities = this.allActivities.filter(
        (a) => a.assignedTo.length === 0
      );
    }

    for (const activity of this.visibleActivities) {
      const newEvent = await this.createEventForActivity(activity);
      if (newEvent) {
        this.existingEvents.push(newEvent);
      }
    }
  }

  public async loadActivitiesImproved() {
    this.allActivities = await this.entityMapper.loadType<RecurringActivity>(
      RecurringActivity
    );
    this.visibleActivities = this.allActivities.filter((a) =>
      a.assignedTo.includes(this.sessionService.getCurrentUser().getId())
    );

    const eventPromises = this.visibleActivities.map((activity) =>
      this.createEventForActivity(activity)
    );
    let events = await Promise.all(eventPromises);
    events = events.filter((event) => !!event);
    this.existingEvents.push(...events);
  }

  async showMore() {
    const additionalActivities = this.allActivities.filter(
      (a) => !this.visibleActivities.includes(a)
    );
    for (const activity of additionalActivities) {
      const newEvent = await this.createEventForActivity(activity);
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

  private async createEventForActivity(
    activity: RecurringActivity
  ): Promise<NoteForActivitySetup> {
    if (this.existingEvents.find((e) => e.relatesTo === activity._id)) {
      return undefined;
    }

    const event = (await this.attendanceService.createEventForActivity(
      activity,
      this.date
    )) as NoteForActivitySetup;
    event.authors = [this.sessionService.getCurrentUser().getId()];
    event.isNewFromActivity = true;
    return event;
  }

  private sortEvents() {
    const calculateEventPriority = (event: Note) => {
      let score = 0;

      const activityAssignedUsers = this.allActivities.find(
        (a) => a._id === event.relatesTo
      )?.assignedTo;
      // use parent activities' assigned users and only fall back to event if necessary
      const assignedUsers = activityAssignedUsers ?? event.authors;

      if (!RecurringActivity.isActivityEventNote(event)) {
        // show one-time events first
        score += 1;
      }

      if (
        assignedUsers.includes(this.sessionService.getCurrentUser().getId())
      ) {
        score += 2;
      }

      return score;
    };

    this.existingEvents = this.existingEvents.sort(
      (a, b) => calculateEventPriority(b) - calculateEventPriority(a)
    );
  }

  createOneTimeEvent() {
    const newNote = Note.create(new Date());
    newNote.authors = [this.sessionService.getCurrentUser().getId()];

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
