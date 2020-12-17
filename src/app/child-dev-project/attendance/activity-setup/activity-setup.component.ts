import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { AttendanceService } from "../attendance.service";
import { Note } from "../../notes/model/note";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { RecurringActivity } from "../model/recurring-activity";

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
    private entityService: EntityMapperService,
    private attendanceService: AttendanceService
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
    this.allActivities = await this.entityService.loadType<RecurringActivity>(
      RecurringActivity
    );
    // TODO: smart filters based on assignedTo, date patterns, etc.
    this.visibleActivities = this.allActivities;

    for (const activity of this.visibleActivities) {
      if (this.existingEvents.find((e) => e.relatesTo === activity)) {
        continue; // skip if already exists
      }
      this.existingEvents.push(this.createEventForActivity(activity));
    }
  }

  async setNewDate(date: Date) {
    this.date = date;

    await this.initAvailableEvents();

    if (!(this.selectedEvent?.relatesTo instanceof RecurringActivity)) {
      this.selectedEvent = null;
    }
  }

  private createEventForActivity(activity: RecurringActivity): Note {
    const event = Note.create(this.date, activity.title);
    event.children = activity.participants;
    event.relatesTo = activity;
    return event;
  }

  private sortEvents() {
    this.existingEvents = this.existingEvents.sort(
      (a, b) => calculateEventPriority(a) - calculateEventPriority(b)
    );

    function calculateEventPriority(event: Note) {
      if (event.relatesTo! instanceof RecurringActivity) {
        return -1;
      }
      return 1;
    }
  }
}
