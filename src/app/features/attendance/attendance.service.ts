import { Injectable, inject } from "@angular/core";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";
import moment from "moment";
import { RecurringActivity } from "./model/recurring-activity";
import { ActivityAttendance } from "./model/activity-attendance";
import { groupBy } from "#src/app/utils/utils";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { EventNote } from "./model/event-note";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { AttendanceItem } from "./model/attendance-item";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";
import { RollCallConfig } from "./model/roll-call-config";
import { AttendanceDatatype } from "./model/attendance.datatype";
import { DateDatatype } from "#src/app/core/basic-datatypes/date/date.datatype";
import { EventWithAttendance } from "./model/event-with-attendance";
import { Logging } from "#src/app/core/logging/logging.service";

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  /**
   * Wrap the given entity in an EventWithAttendance,
   * which provides typed access to attendance and date fields.
   *
   * The entity must have at least one attendance field and one date field for this to work, otherwise an error is thrown.
   */
  static createEventFromEntity(entity: Entity): EventWithAttendance {
    const attendanceField = AttendanceDatatype.detectFieldInEntity(entity);
    const dateField = DateDatatype.detectFieldInEntity(entity);
    if (!attendanceField || !dateField) {
      Logging.debug("Entity missing attendance fields", entity.getId());
      throw new Error(
        `Entity does not have the required attendance and date fields for roll call.`,
      );
    }
    return new EventWithAttendance(entity, attendanceField, dateField);
  }

  private readonly entityMapper = inject(EntityMapperService);
  private readonly dbIndexing = inject(DatabaseIndexingService);
  private readonly childrenService = inject(ChildrenService);
  private readonly currentUser = inject(CurrentUserSubject);

  /**
   * Default configuration for the roll-call UI.
   *
   * Will become configurable in the future.
   */
  readonly rollCallConfig: RollCallConfig = {
    filterConfig: [{ id: "category" }, { id: "schools" }],
    extraField: "category",
  };

  constructor() {
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
        if (
          !event.childrenAttendance.some(
            (a) => a.participant === newParticipant,
          )
        ) {
          event.childrenAttendance.push(
            new AttendanceItem(undefined, "", newParticipant),
          );
        }
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

    const events = await this.getEventsForActivity(activity.getId(), sinceDate);

    const getOrCreateAttendancePeriod = (event: EventWithAttendance) => {
      const month = new Date(event.date.getFullYear(), event.date.getMonth());
      let attMonth = periods.get(month.getTime());
      if (!attMonth) {
        attMonth = ActivityAttendance.create(month, []);
        attMonth.periodTo = moment(month).endOf("month").toDate();
        attMonth.activity = activity;
        periods.set(month.getTime(), attMonth);
      }
      return attMonth;
    };

    for (const event of events) {
      const wrapped = AttendanceService.createEventFromEntity(event);
      const record = getOrCreateAttendancePeriod(wrapped);
      record.events.push(wrapped);
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
      const activityRecord = ActivityAttendance.create(
        from,
        activityEvents.map((e) => AttendanceService.createEventFromEntity(e)),
      );
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

    const visitedSchools =
      await this.childrenService.queryActiveRelationsOf(childId);
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

  /**
   * Load all events available for a roll call on the given date,
   * merging existing events with new (unsaved) events generated from recurring activities.
   *
   * Returns two lists: `events` contains only events relevant to the current user
   * (assigned activities), while `allEvents` contains everything.
   *
   * @param date The date for which to load events.
   */
  async getAvailableEventsForRollCall(date: Date): Promise<{
    events: EventWithAttendance[];
    allEvents: EventWithAttendance[];
  }> {
    const currentUserId = this.currentUser.value?.getId();
    const existingEvents = await this.getEventsWithUpdatedParticipants(date);

    const allActivities = (
      await this.entityMapper.loadType(RecurringActivity)
    ).filter((a) => a.isActive);

    const allEvents: EventWithAttendance[] = (
      await this.buildEventsFromActivities(
        allActivities,
        existingEvents,
        currentUserId,
        date,
      )
    ).map((e) => AttendanceService.createEventFromEntity(e));

    let assignedActivityIds = allActivities
      .filter((a) => a.isAssignedTo(currentUserId))
      .map((a) => a.getId());

    const filteredEvents = !currentUserId
      ? allEvents
      : allEvents.filter(
          (e) =>
            !e.isActivityEvent || assignedActivityIds.includes(e.activityId),
        );

    return {
      events: filteredEvents,
      allEvents: allEvents,
    };
  }

  private async buildEventsFromActivities(
    activities: RecurringActivity[],
    existingEvents: EventNote[],
    currentUserId: string | undefined,
    date: Date,
  ): Promise<Entity[]> {
    const newEvents = await Promise.all(
      activities.map(async (activity) => {
        if (existingEvents.find((e) => e.relatesTo === activity.getId())) {
          return undefined;
        }
        const event = await this.createEventForActivity(activity, date);
        if (currentUserId) {
          (event.entity as EventNote).authors = [currentUserId];
        }
        return event.entity as EventNote;
      }),
    );
    const events: Entity[] = existingEvents.concat(
      newEvents.filter((e): e is EventNote => !!e),
    );

    this.sortEventsByRelevance(events, activities);
    return events;
  }

  private sortEventsByRelevance(
    events: Entity[],
    allActivities: RecurringActivity[],
  ): void {
    const calculatePriority = (event: Entity): number => {
      let score = 0;

      const relatesTo = event["relatesTo"] as string | undefined;
      const isActivity = event["relatesTo"]?.length > 0;
      const activityAssignedUsers = isActivity
        ? allActivities.find((a) => a.getId() === relatesTo)?.assignedTo
        : undefined;
      // use parent activity's assigned users and only fall back to event if necessary
      const assignedUsers: string[] =
        activityAssignedUsers ?? event["authors"] ?? [];

      if (!isActivity) {
        // show one-time events first
        score += 1;
      }

      const currentUserId = this.currentUser.value?.getId();
      if (currentUserId && assignedUsers.includes(currentUserId)) {
        score += 2;
      }

      return score;
    };

    events.sort((a, b) => calculatePriority(b) - calculatePriority(a));
  }

  async createEventForActivity(
    activity: RecurringActivity | string,
    date: Date,
  ): Promise<EventWithAttendance> {
    if (typeof activity === "string") {
      activity = await this.entityMapper.load(RecurringActivity, activity);
    }

    const instance = new EventNote();
    instance.date = date;
    instance.subject = activity.title;
    const participantIds = await this.getActiveParticipantsOfActivity(
      activity,
      date,
    );
    instance.children = participantIds;
    instance.childrenAttendance = participantIds.map(
      (id) => new AttendanceItem(undefined, "", id),
    );
    instance.schools = activity.linkedGroups;
    instance.relatesTo = activity.getId();
    instance.category = activity.type;

    if (this.currentUser.value) {
      instance.authors = [this.currentUser.value.getId()];
    }

    return AttendanceService.createEventFromEntity(instance);
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
        .queryActiveRelationsOf(groupId, date)
        .then((relations) =>
          relations.map((r) => r.childId).filter((id) => !!id),
        ),
    );
    const allParticipants = await Promise.all(childIdPromises);
    // flatten and remove duplicates
    return Array.from(new Set([].concat(...allParticipants)));
  }
}
