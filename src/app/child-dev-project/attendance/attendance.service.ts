import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import moment from "moment";
import { RecurringActivity } from "./model/recurring-activity";
import { ActivityAttendance } from "./model/activity-attendance";
import { groupBy } from "../../utils/utils";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";
import { EventNote } from "./model/event-note";
import { ChildrenService } from "../children/children.service";

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  constructor(
    private entityMapper: EntityMapperService,
    private dbIndexing: DatabaseIndexingService,
    private childrenService: ChildrenService,
  ) {
    this.createIndices();
  }

  private createIndices() {
    this.createEventsIndex();
    this.createRecurringActivitiesIndex();
  }

  private createEventsIndex(): Promise<void> {
    const designDoc = {
      _id: "_design/events_index",
      views: {
        by_date: {
          map: `(doc) => {
            if (doc._id.startsWith("${EventNote.ENTITY_TYPE}")) {
              if (doc.date && doc.date.length === 10) {
                emit(doc.date);
              } else {
                var d = new Date(doc.date || null);
                var dString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
                emit(dString);
              }
            }
          }`,
        },
        // TODO: remove this and use general Note's relatedEntities index?
        by_activity: {
          map: `(doc) => {
            if (doc._id.startsWith("${EventNote.ENTITY_TYPE}") && doc.relatesTo) {
              var dString;
              if (doc.date && doc.date.length === 10) {
                dString = doc.date;
              } else {            
                var d = new Date(doc.date || null);
                dString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
              }
              emit(doc.relatesTo + "_" + dString);
            }
          }`,
        },
      },
    };

    return this.dbIndexing.createIndex(designDoc);
  }

  private createRecurringActivitiesIndex(): Promise<void> {
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
    endDate: Date = startDate,
  ): Promise<EventNote[]> {
    const start = moment(startDate);
    const end = moment(endDate);

    const eventNotes = this.dbIndexing.queryIndexDocsRange(
      EventNote,
      "events_index/by_date",
      start.format("YYYY-MM-DD"),
      end.format("YYYY-MM-DD"),
    );

    const relevantNormalNotes = this.childrenService
      .getNotesInTimespan(start, end)
      .then((notes) => notes.filter((n) => n.category?.isMeeting));

    const allResults = await Promise.all([eventNotes, relevantNormalNotes]);
    return allResults[0].concat(allResults[1]);
  }

  async getEventsWithUpdatedParticipants(date: Date) {
    const events = await this.getEventsOnDate(date, date);
    for (const event of events) {
      const participants = await this.loadParticipantsOfGroups(
        event.schools,
        date,
      );
      for (const newParticipant of participants) {
        event.addChild(newParticipant);
      }
    }
    return events;
  }

  /**
   * Load events related to the given recurring activity.
   * @param activityId The reference activity the events should relate to.
   * @param sinceDate (Optional) date starting from which events should be considered. Events before this are ignored to improve performance.
   */
  async getEventsForActivity(
    activityId: string,
    sinceDate?: Date,
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

    return this.dbIndexing.queryIndexDocsRange(
      EventNote,
      "events_index/by_activity",
      activityId + dateLimit,
      activityId,
    );
  }

  /**
   * Load and calculate activity attendance records.
   * @param activity To activity for which records are loaded.
   * @param sinceDate (Optional) date starting from which events should be considered. Events before this are ignored to improve performance.
   */
  async getActivityAttendances(
    activity: RecurringActivity,
    sinceDate?: Date,
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

    const events = await this.getEventsForActivity(
      activity.getId(true),
      sinceDate,
    );

    for (const event of events) {
      const record = getOrCreateAttendancePeriod(event);
      record.events.push(event);
    }

    return Array.from(periods.values()).sort(
      (a, b) => a.periodFrom.getTime() - b.periodFrom.getTime(),
    );
  }

  async getAllActivityAttendancesForPeriod(
    from: Date,
    until: Date,
  ): Promise<ActivityAttendance[]> {
    const matchingEvents = await this.getEventsOnDate(from, until);
    const groupedEvents = groupBy(matchingEvents, "relatesTo");

    const records = [];
    for (const [activityId, activityEvents] of groupedEvents) {
      const activityRecord = ActivityAttendance.create(from, activityEvents);
      activityRecord.periodTo = until;
      if (activityId) {
        activityRecord.activity = await this.entityMapper
          .load<RecurringActivity>(RecurringActivity, activityId)
          .catch(() => undefined);
      }

      records.push(activityRecord);
    }

    return records;
  }

  async getActivitiesForChild(childId: string): Promise<RecurringActivity[]> {
    const activities = await this.dbIndexing.queryIndexDocs(
      RecurringActivity,
      "activities_index/by_participant",
      childId,
    );

    const visitedSchools = await this.childrenService.queryActiveRelationsOf(
      "child",
      childId,
    );
    for (const currentRelation of visitedSchools) {
      const activitiesThroughRelation = await this.dbIndexing.queryIndexDocs(
        RecurringActivity,
        "activities_index/by_school",
        currentRelation.schoolId,
      );
      for (const activityThroughRelation of activitiesThroughRelation) {
        if (
          !activities.some((a) => a.getId() === activityThroughRelation.getId())
        ) {
          activities.push(activityThroughRelation);
        }
      }
    }

    return activities;
  }

  async createEventForActivity(
    activity: RecurringActivity,
    date: Date,
  ): Promise<EventNote> {
    const instance = new EventNote();
    instance.date = date;
    instance.subject = activity.title;
    instance.children = await this.getActiveParticipantsOfActivity(
      activity,
      date,
    );
    instance.schools = activity.linkedGroups;
    instance.relatesTo = activity.getId(true);
    instance.category = activity.type;
    return instance;
  }

  private async getActiveParticipantsOfActivity(
    activity: RecurringActivity,
    date: Date,
  ): Promise<string[]> {
    const schoolParticipants = await this.loadParticipantsOfGroups(
      activity.linkedGroups,
      date,
    );

    return [
      ...new Set(activity.participants.concat(...schoolParticipants)), //  remove duplicates
    ].filter((p) => !activity.excludedParticipants.includes(p));
  }

  /**
   * Load all participants' ids for the given list of groups
   * @param linkedGroups
   * @param date on which the participants should be part of the group
   */
  private async loadParticipantsOfGroups(
    linkedGroups: string[],
    date: Date,
  ): Promise<string[]> {
    const childIdPromises = linkedGroups.map((groupId) =>
      this.childrenService
        .queryActiveRelationsOf("school", groupId, date)
        .then((relations) =>
          relations.map((r) => r.childId).filter((id) => !!id),
        ),
    );
    const allParticipants = await Promise.all(childIdPromises);
    // flatten and remove duplicates
    return Array.from(new Set([].concat(...allParticipants)));
  }
}
