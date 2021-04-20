import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { RecurringActivity } from "../model/recurring-activity";
import { AttendanceMonth } from "../model/attendance-month";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { AttendanceStatus } from "../model/attendance-status";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { AttendanceService } from "../attendance.service";
import moment from "moment";
import { EventNote } from "../model/event-note";
import { Note } from "../../notes/model/note";

@Injectable({
  providedIn: "root",
})
export class AttendanceMigrationService {
  activities: { [key: string]: RecurringActivity } = {
    school: Object.assign(new RecurringActivity("school"), {
      entityId: "school",
      title: $localize`School`,
      type: defaultInteractionTypes.find((t) => t.id === "SCHOOL_CLASS"),
    }),
    coaching: Object.assign(new RecurringActivity("coaching"), {
      entityId: "coaching",
      title: $localize`Coaching`,
      type: defaultInteractionTypes.find((t) => t.id === "COACHING_CLASS"),
    }),
  };

  existingEvents: EventNote[] = [];

  constructor(
    private entityMapper: EntityMapperService,
    private attendanceService: AttendanceService
  ) {}

  async createEventsForAllAttendanceMonths() {
    await this.checkOrCreateActivities();

    this.existingEvents = await this.entityMapper.loadType(EventNote);

    const months = await this.entityMapper.loadType(AttendanceMonth);
    console.log(
      "starting to migrate attendance-month records:" + months.length
    );
    for (let i = 0; i < months.length; i++) {
      await this.createEventsForAttendanceMonth(months[i]);
      if (i % 100 === 1) {
        console.log("finished " + (i + 1));
      }
    }
    console.log("parsed all AttendanceMonths");

    for (const e of this.existingEvents) {
      await this.entityMapper.save(e);
    }
    console.log("wrote all events to database");

    console.log("updating activity participants");
    await this.addStudentsToActivityForAllAttendanceMonths();
    console.log("DONE");
  }

  async addStudentsToActivityForAllAttendanceMonths() {
    await this.checkOrCreateActivities();

    const months = await this.entityMapper.loadType(AttendanceMonth);
    for (const month of months) {
      if (!this.activities.hasOwnProperty(month.institution)) {
        console.warn(
          "cannot migrate attendance month because of unknown institution",
          month
        );
        continue;
      }

      this.activities[month.institution].participants.push(month.student);
    }

    const unique = (value, index, self) => {
      return self.indexOf(value) === index;
    };
    for (const activity of Object.values(this.activities)) {
      activity.participants = activity.participants.filter(unique);
      await this.entityMapper.save(activity);
    }
  }

  private async checkOrCreateActivities() {
    for (const key of Object.keys(this.activities)) {
      this.activities[key] = await this.entityMapper
        .load(RecurringActivity, this.activities[key].getId())
        .catch(async (err) => {
          if (err.status === 404) {
            await this.entityMapper.save(this.activities[key]);
            return this.entityMapper.load(
              RecurringActivity,
              this.activities[key].getId()
            );
          } else {
            throw err;
          }
        });
    }
  }
  async createEventsForAttendanceMonth(old: AttendanceMonth) {
    if (!this.activities.hasOwnProperty(old.institution)) {
      console.warn(
        "cannot migrate attendance month because of unknown institution",
        old
      );
      return;
    }

    const existingActivityEvents = this.existingEvents.filter(
      (e) => e.relatesTo === this.activities[old.institution]._id
    );

    for (const day of old.dailyRegister) {
      if (day.status === AttendanceStatus.UNKNOWN) {
        // skip status without actual information
        continue;
      }

      let newEvent = existingActivityEvents.find((e) =>
        moment(e.date).isSame(day.date, "day")
      );
      if (!newEvent) {
        // no Note in the database yet - create a new event
        newEvent = await this.attendanceService.createEventForActivity(
          this.activities[old.institution],
          day.date
        );
        newEvent.children = [];
        this.existingEvents.push(newEvent);
      }

      newEvent.children.push(old.student);
      newEvent.getAttendance(
        old.student
      ).status = defaultAttendanceStatusTypes.find(
        (t) => t.shortName === day.status
      );
      newEvent.getAttendance(old.student).remarks = day.remarks;
    }
  }

  async changeNotesToEventNotes() {
    const oldEventNotes = (await this.entityMapper.loadType(Note)).filter(
      (n) => n.relatesTo
    );

    for (const note of oldEventNotes) {
      const newEvent = new EventNote(note.getId());
      newEvent.date = note.date;
      newEvent.subject = note.subject;
      newEvent.children = note.children;
      newEvent.relatesTo = note.relatesTo;
      newEvent.category = note.category;
      // @ts-ignore
      newEvent.childrenAttendance = note.childrenAttendance;

      await this.entityMapper.remove(note);
      await this.entityMapper.save(newEvent);
      console.log("event-note migrated", newEvent.getId());
    }
  }
}
