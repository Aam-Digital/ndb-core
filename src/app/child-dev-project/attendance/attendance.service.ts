import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import moment from "moment";
import { Note } from "../notes/model/note";
import { RecurringActivity } from "./model/recurring-activity";
import { ActivityAttendance } from "./model/activity-attendance";
import { groupBy } from "../../utils/utils";

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  constructor(private entityMapper: EntityMapperService) {}

  async getEventsOnDate(date: Date) {
    const events = await this.entityMapper.loadType<Note>(Note);
    return events.filter(
      (e) => e.category?.isMeeting && moment(e.date).isSame(date, "day")
    );
  }

  async getActivityAttendances(
    activity: RecurringActivity
  ): Promise<ActivityAttendance[]> {
    const periods = new Map<number, ActivityAttendance>();
    function getOrCreateAttendancePeriod(event) {
      const month = new Date(event.date.getFullYear(), event.date.getMonth());
      let attMonth = periods.get(month.getTime());
      if (!attMonth) {
        attMonth = ActivityAttendance.create(month);
        attMonth.periodTo = moment(month).endOf("month").toDate();
        attMonth.activity = activity;
        periods.set(month.getTime(), attMonth);
      }
      return attMonth;
    }

    // TODO: implement index
    const events = (await this.entityMapper.loadType<Note>(Note)).filter(
      (e) => e.relatesTo === activity._id
    );

    for (const event of events) {
      const record = getOrCreateAttendancePeriod(event);
      record.events.push(event);
    }

    return Array.from(periods.values());
  }

  async getActivityAttendanceForPeriod(
    activity: RecurringActivity,
    from: Date,
    until: Date
  ): Promise<ActivityAttendance> {
    const events = (await this.entityMapper.loadType<Note>(Note)).filter(
      (e) => e.relatesTo === activity._id && e.date >= from && e.date <= until
    );

    const record = ActivityAttendance.create(from, events);
    record.periodTo = until;
    record.activity = activity;

    return record;
  }

  async getAllActivityAttendancesForPeriod(
    from: Date,
    until: Date
  ): Promise<ActivityAttendance[]> {
    const matchingEvents = (
      await this.entityMapper.loadType<Note>(Note)
    ).filter(
      (e) =>
        e.relatesTo?.startsWith(RecurringActivity.ENTITY_TYPE) &&
        e.date >= from &&
        e.date <= until
    );

    const groupedEvents: Map<string, Note[]> = groupBy(
      matchingEvents,
      "relatesTo"
    );

    const records = [];
    for (const [activityId, activityEvents] of groupedEvents) {
      const activityRecord = ActivityAttendance.create(from, activityEvents);
      activityRecord.periodTo = until;
      activityRecord.activity = await this.entityMapper
        .load<RecurringActivity>(RecurringActivity, activityId)
        .catch(() => undefined);

      records.push(activityRecord);
    }

    return records;
  }

  async getActivitiesForChild(childId: string): Promise<RecurringActivity[]> {
    // TODO: index
    const activities = await this.entityMapper.loadType<RecurringActivity>(
      RecurringActivity
    );
    return activities.filter((a) => a.participants.includes(childId));
  }
}
