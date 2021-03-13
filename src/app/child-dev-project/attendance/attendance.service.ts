import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import moment from "moment";
import { RecurringActivity } from "./model/recurring-activity";
import { ActivityAttendance } from "./model/activity-attendance";
import { groupBy } from "../../utils/utils";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";
import { ConfigService } from "../../core/config/config.service";
import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "../notes/model/interaction-type.interface";
import { EventNote } from "./model/event-note";
import { ChildrenService } from "../children/children.service";

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  constructor(
    private entityMapper: EntityMapperService,
    private dbIndexing: DatabaseIndexingService,
    private configService: ConfigService,
    private childrenService: ChildrenService
  ) {
    this.createIndices();
  }

  private async createIndices() {
    const meetingInteractionTypes = this.configService
      .getConfig<InteractionType[]>(INTERACTION_TYPE_CONFIG_ID)
      .filter((t) => t.isMeeting)
      .map((t) => t.id);
    await this.createEventsIndex(meetingInteractionTypes);
    await this.createRecurringActivitiesIndex();
  }

  private createEventsIndex(meetingInteractionTypes: string[]): Promise<any> {
    const designDoc = {
      _id: "_design/events_index",
      views: {
        by_date: {
          map: `(doc) => {
            if (doc._id.startsWith("${EventNote.ENTITY_TYPE}") &&
                ${JSON.stringify(
                  meetingInteractionTypes
                )}.includes(doc.category)
            ) {
              var d = new Date(doc.date || null);
              var dString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
              emit(dString);
            }
          }`,
        },
        by_activity: {
          map: `(doc) => {
            if (doc._id.startsWith("${EventNote.ENTITY_TYPE}") && doc.relatesTo) {
              var d = new Date(doc.date || null);
              var dString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
              emit(doc.relatesTo + "_" + dString);
            }
          }`,
        },
      },
    };

    return this.dbIndexing.createIndex(designDoc);
  }

  private createRecurringActivitiesIndex(): Promise<any> {
    const designDoc = {
      _id: "_design/activities_index",
      views: {
        by_participant: {
          map: `(doc) => {
            if (doc._id.startsWith("${RecurringActivity.ENTITY_TYPE}")) {
              for (var p of (doc.participants || [])) {
                emit(p);
              }
            }
          }`,
        },
        by_school: {
          map: `(doc) => {
            if (doc._id.startsWith("${RecurringActivity.ENTITY_TYPE}")) {
              for (var g of (doc.linkedGroups || [])) {
                emit(g);
              }
            }
          }`,
        },
      },
    };

    return this.dbIndexing.createIndex(designDoc);
  }

  /**
   * Return all events on the given date or date range.
   * @param startDate The date (or start date of a range)
   * @param endDate (Optional) end date of the period to be queried; if not given, defaults to the start date
   */
  async getEventsOnDate(
    startDate: Date,
    endDate: Date = startDate
  ): Promise<EventNote[]> {
    return await this.dbIndexing.queryIndexDocsRange(
      EventNote,
      "events_index/by_date",
      startDate.toISOString().substr(0, 10),
      endDate.toISOString().substr(0, 10)
    );
  }

  /**
   * Load events related to the given recurring activity.
   * @param activityId The reference activity the events should relate to.
   * @param sinceDate (Optional) date starting from which events should be considered. Events before this are ignored to improve performance.
   */
  async getEventsForActivity(
    activityId: string,
    sinceDate?: Date
  ): Promise<EventNote[]> {
    if (!activityId.startsWith(RecurringActivity.ENTITY_TYPE)) {
      activityId = RecurringActivity.ENTITY_TYPE + ":" + activityId;
    }

    let dateLimit = "";
    if (sinceDate) {
      dateLimit =
        "_" +
        sinceDate.getFullYear() +
        "-" +
        String(sinceDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(sinceDate.getDate()).padStart(2, "0");
    }

    return await this.dbIndexing.queryIndexDocsRange(
      EventNote,
      "events_index/by_activity",
      activityId + dateLimit,
      activityId
    );
  }

  /**
   * Load and calculate activity attendance records.
   * @param activity To activity for which records are loaded.
   * @param sinceDate (Optional) date starting from which events should be considered. Events before this are ignored to improve performance.
   */
  async getActivityAttendances(
    activity: RecurringActivity,
    sinceDate?: Date
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

    const events = await this.getEventsForActivity(activity._id, sinceDate);

    for (const event of events) {
      const record = getOrCreateAttendancePeriod(event);
      record.events.push(event);
    }

    return Array.from(periods.values()).sort(
      (a, b) => a.periodFrom.getTime() - b.periodFrom.getTime()
    );
  }

  async getAllActivityAttendancesForPeriod(
    from: Date,
    until: Date
  ): Promise<ActivityAttendance[]> {
    const matchingEvents = await this.getEventsOnDate(from, until);

    const groupedEvents: Map<string, EventNote[]> = groupBy(
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
    const promiseByParticipant = this.dbIndexing.queryIndexDocs(
      RecurringActivity,
      "activities_index/by_participant",
      childId
    );
    const visitedSchools = await this.childrenService.queryRelationsOf(
      "child",
      childId
    );
    const promisesBySchool = visitedSchools
      .filter((schoolRelation) => schoolRelation.isActive())
      .map((relation) =>
        this.dbIndexing.queryIndexDocs(
          RecurringActivity,
          "activities_index/by_school",
          relation.schoolId
        )
      );
    const uniqueActivities = await promiseByParticipant;
    const activitiesBySchool = await Promise.all(promisesBySchool);
    activitiesBySchool.forEach((activities) =>
      activities.forEach((activity) =>
        uniqueActivities.some((a) => a.getId() === activity.getId())
          ? null
          : uniqueActivities.push(activity)
      )
    );
    return uniqueActivities;
  }

  async createEventForActivity(
    activity: RecurringActivity,
    date: Date
  ): Promise<EventNote> {
    const instance = new EventNote();
    const childIdPromises = activity.linkedGroups.map((groupId) =>
      this.childrenService
        .queryRelationsOf("school", groupId)
        .then((relations) => relations.map((r) => r.childId))
    );
    const schoolParticipants = await Promise.all(childIdPromises);
    instance.date = date;
    instance.subject = activity.title;
    instance.children = [
      ...new Set(activity.participants.concat(...schoolParticipants)), //  remove duplicates
    ];
    instance.relatesTo = activity._id;
    instance.category = activity.type;
    return instance;
  }
}
