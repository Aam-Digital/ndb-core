import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { RecurringActivity } from "../model/recurring-activity";
import { AttendanceMonth } from "../model/attendance-month";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { AttendanceStatus } from "../model/attendance-status";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { AttendanceService } from "../attendance.service";
import moment from "moment";

@Injectable({
  providedIn: "root",
})
export class AttendanceMigrationService {
  schoolActivity: RecurringActivity;
  coachingActivity: RecurringActivity;

  constructor(
    private entityMapper: EntityMapperService,
    private attendanceService: AttendanceService
  ) {
    this.schoolActivity = new RecurringActivity("school");
    this.schoolActivity.title = "school";
    this.schoolActivity.type = defaultInteractionTypes.find(
      (t) => t.id === "SCHOOL_CLASS"
    );

    this.coachingActivity = new RecurringActivity("coaching");
    this.coachingActivity.title = "coaching";
    this.coachingActivity.type = defaultInteractionTypes.find(
      (t) => t.id === "COACHING_CLASS"
    );
  }

  async createEventsForAllAttendanceMonths() {
    const months = await this.entityMapper.loadType(AttendanceMonth);
    for (const month of months) {
      await this.createEventsForAttendanceMonth(month);
    }
  }

  async createEventsForAttendanceMonth(old: AttendanceMonth) {
    let masterActivity: RecurringActivity;
    if (old.institution === "school") {
      masterActivity = this.schoolActivity;
    } else if (old.institution === "coaching") {
      masterActivity = this.coachingActivity;
    } else {
      console.warn(
        "cannot migrate attendance month because of unknown institution",
        old
      );
      return;
    }

    const existingActivityEvents = await this.attendanceService.getEventsForActivity(
      masterActivity._id
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
        newEvent = RecurringActivity.createEventForActivity(
          masterActivity,
          day.date
        );
        newEvent.children = [];
      }

      newEvent.children.push(old.student);
      newEvent.getAttendance(
        old.student
      ).status = defaultAttendanceStatusTypes.find(
        (t) => t.shortName === day.status
      );
      newEvent.getAttendance(old.student).remarks = day.remarks;

      await this.entityMapper.save(newEvent);
    }
  }
}
