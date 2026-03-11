import { Injectable, inject } from "@angular/core";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";
import moment from "moment";
import { ActivityAttendance } from "./model/activity-attendance";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { AttendanceItem } from "./model/attendance-item";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";
import {
  EventTypeSettings,
  AttendanceFeatureConfig,
  AttendanceFeatureSettings,
} from "./model/attendance-feature-config";
import { EventWithAttendance } from "./model/event-with-attendance";
import { ConfigService } from "#src/app/core/config/config.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { GroupParticipantResolverService } from "./deprecated/group-participant-resolver";
import { AttendanceDatatype } from "./model/attendance.datatype";
import { DateDatatype } from "#src/app/core/basic-datatypes/date/date.datatype";

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  static readonly CONFIG_KEY = "appConfig:attendance";

  private static readonly DEFAULT_CONFIG: AttendanceFeatureConfig = {
    eventTypes: [
      {
        activityType: "RecurringActivity",
        eventType: "EventNote",
        filterConfig: [{ id: "category" }, { id: "schools" }],
        extraField: "category",
        fieldMapping: {
          subject: "title",
          category: "type",
          schools: "linkedGroups",
          children: "participants",
        },
      },
    ],
    groupBasedParticipants: false,
  };

  private readonly entityMapper = inject(EntityMapperService);
  private readonly dbIndexing = inject(DatabaseIndexingService);
  private readonly childrenService = inject(ChildrenService);
  private readonly currentUser = inject(CurrentUserSubject);
  private readonly configService = inject(ConfigService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly groupParticipantResolver = inject(
    GroupParticipantResolverService,
  );

  featureSettings: AttendanceFeatureSettings = this.resolveSettings(undefined);

  constructor() {
    this.configService.configUpdates.subscribe((config) => {
      this.featureSettings = this.resolveSettings(
        config?.data?.[AttendanceService.CONFIG_KEY],
      );
      this.createIndices();
    });
  }

  private resolveSettings(
    raw?: AttendanceFeatureConfig,
  ): AttendanceFeatureSettings {
    const eventTypesConfig =
      raw?.eventTypes ?? AttendanceService.DEFAULT_CONFIG.eventTypes ?? [];
    const groupBasedParticipants =
      raw?.groupBasedParticipants ??
      AttendanceService.DEFAULT_CONFIG.groupBasedParticipants ??
      false;

    const eventTypeSettings: EventTypeSettings[] = eventTypesConfig
      .map((typeConfig) => {
        const eventTypeName = typeConfig.eventType;
        if (!this.entityRegistry.has(eventTypeName)) return null;

        const activityTypeName = typeConfig.activityType;
        if (activityTypeName && !this.entityRegistry.has(activityTypeName))
          return null;

        return {
          activityType: activityTypeName
            ? this.entityRegistry.get(activityTypeName)
            : undefined,
          eventType: this.entityRegistry.get(eventTypeName),
          participantsField: typeConfig.participantsField ?? "participants",
          dateField: typeConfig.dateField,
          relatesToField: typeConfig.relatesToField ?? "relatesTo",
          assignedUsersField: typeConfig.assignedUsersField ?? "authors",
          filterConfig: typeConfig.filterConfig ?? [],
          extraField: typeConfig.extraField ?? "",
          fieldMapping: typeConfig.fieldMapping ?? {},
        } as EventTypeSettings;
      })
      .filter((s): s is EventTypeSettings => s !== null);

    const recurringActivityTypes = [
      ...new Set(
        eventTypeSettings
          .filter((s) => s.activityType !== undefined)
          .map((s) => s.activityType!),
      ),
    ];
    const eventTypes = [...new Set(eventTypeSettings.map((s) => s.eventType))];

    const filterConfigMap = new Map();
    for (const typeSettings of eventTypeSettings) {
      for (const f of typeSettings.filterConfig) {
        filterConfigMap.set(f.id, f);
      }
    }

    return {
      eventTypeSettings,
      recurringActivityTypes,
      eventTypes,
      filterConfig: Array.from(filterConfigMap.values()),
      groupBasedParticipants,
    };
  }

  private createIndices() {
    this.createEventsIndex();
    this.createRecurringActivitiesIndex();
  }

  private createEventsIndex(): Promise<void> {
    if (this.featureSettings.eventTypes.length === 0) {
      return Promise.resolve();
    }

    const eventTypeChecks = this.featureSettings.eventTypes
      .map((t) => `doc._id.startsWith("${t.ENTITY_TYPE}:")`)
      .join(" || ");

    const byActivityEmits = this.featureSettings.eventTypeSettings
      .filter((s) => s.activityType !== undefined)
      .map(
        ({ eventType, relatesToField }) =>
          `      if (doc._id.startsWith("${eventType.ENTITY_TYPE}:") && doc["${relatesToField}"]) {
        emit(doc["${relatesToField}"] + "_" + dString);
      }`,
      )
      .join("\n");

    const designDoc = {
      _id: "_design/events_index",
      views: {
        by_date: {
          map: `(doc) => {
            if (${eventTypeChecks}) {
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
        by_activity: {
          map: `(doc) => {
            var dString;
            if (doc.date && doc.date.length === 10) {
              dString = doc.date;
            } else {
              var d = new Date(doc.date || null);
              dString = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
            }
${byActivityEmits}
          }`,
        },
      },
    };

    return this.dbIndexing.createIndex(designDoc);
  }

  private createRecurringActivitiesIndex(): Promise<void> {
    const activitySettings = this.featureSettings.eventTypeSettings.filter(
      (s) => s.activityType !== undefined,
    );
    if (activitySettings.length === 0) {
      return Promise.resolve();
    }

    const byParticipantChecks = activitySettings
      .map(
        ({ activityType, participantsField }) =>
          `      if (doc._id.startsWith("${activityType!.ENTITY_TYPE}:")) {
        for (var p of (doc["${participantsField}"] || [])) {
          emit(p);
        }
      }`,
      )
      .join("\n");

    const designDoc = {
      _id: "_design/activities_index",
      views: {
        by_participant: {
          map: `(doc) => {
${byParticipantChecks}
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
  ): Promise<Entity[]> {
    const start = moment(startDate);
    const end = moment(endDate);

    const eventQueries = this.featureSettings.eventTypes.map((eventType) =>
      this.dbIndexing.queryIndexDocsRange(
        eventType,
        "events_index/by_date",
        start.format("YYYY-MM-DD"),
        end.format("YYYY-MM-DD"),
      ),
    );

    const relevantNormalNotes = this.childrenService
      .getNotesInTimespan(start, end)
      .then((notes) => notes.filter((n) => n.category?.isMeeting));

    const allResults = await Promise.all([
      ...eventQueries,
      relevantNormalNotes,
    ]);
    return ([] as Entity[]).concat(...allResults);
  }

  /**
   * Load events related to the given activity.
   * @param activityId The reference activity the events should relate to.
   * @param sinceDate (Optional) date starting from which events should be considered. Events before this are ignored to improve performance.
   */
  private async getEventsForActivity(
    activityId: string,
    sinceDate?: Date,
  ): Promise<Entity[]> {
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

    const eventQueries = this.featureSettings.eventTypes.map((eventType) =>
      this.dbIndexing.queryIndexDocsRange(
        eventType,
        "events_index/by_activity",
        activityId + dateLimit,
        activityId,
      ),
    );

    const results = await Promise.all(eventQueries);
    return ([] as Entity[]).concat(...results);
  }

  /**
   * Load and calculate activity attendance records grouped by month.
   * @param activity The activity for which records are loaded.
   * @param from (Optional) date starting from which events should be considered.
   */
  async getActivityAttendances(
    activity: Entity,
    from?: Date,
  ): Promise<ActivityAttendance[]> {
    const periods = new Map<number, ActivityAttendance>();

    const events = await this.getEventsForActivity(activity.getId(), from);

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
      const wrapped = this.wrapEventEntity(event);
      const record = getOrCreateAttendancePeriod(wrapped);
      record.events.push(wrapped);
    }

    return Array.from(periods.values()).sort(
      (a, b) => a.periodFrom.getTime() - b.periodFrom.getTime(),
    );
  }

  /**
   * Load all activities that list the given participant ID in their `participants` field.
   * Queries all configured recurring activity types (see {@link AttendanceFeatureConfig.recurringActivityTypes}).
   *
   * When {@link AttendanceFeatureConfig.groupBasedParticipants} is enabled,
   * also includes activities linked via school group membership (legacy).
   *
   * @param participantId The entity ID of the participant to look up.
   */
  async getActivitiesForParticipant(participantId: string): Promise<Entity[]> {
    const directActivities = await Promise.all(
      this.featureSettings.recurringActivityTypes.map((activityType) =>
        this.dbIndexing.queryIndexDocs(
          activityType,
          "activities_index/by_participant",
          participantId,
        ),
      ),
    );
    const results = ([] as Entity[]).concat(...directActivities);

    if (!this.featureSettings.groupBasedParticipants) {
      return results;
    }

    const groupActivities =
      await this.groupParticipantResolver.getActivitiesForParticipantViaGroups(
        participantId,
        this.featureSettings.recurringActivityTypes,
      );

    const merged = new Map<string, Entity>();
    for (const a of [...results, ...groupActivities]) {
      merged.set(a.getId(), a);
    }
    return Array.from(merged.values());
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
    const existingEvents = await this.getEventsOnDate(date, date);

    const allActivitiesNested = await Promise.all(
      this.featureSettings.eventTypeSettings
        .filter((s) => s.activityType !== undefined)
        .map((typeSettings) =>
          this.entityMapper.loadType(typeSettings.activityType!),
        ),
    );
    const allActivities = ([] as Entity[])
      .concat(...allActivitiesNested)
      .filter((a) => a.isActive);

    const allEvents = await this.buildEventsFromActivities(
      allActivities,
      existingEvents,
      date,
    );

    const assignedActivityIds = allActivities
      .filter((a) => this.getActivityAssignedUsers(a)?.includes(currentUserId))
      .map((a) => a.getId());

    const filteredEvents = !currentUserId
      ? allEvents
      : allEvents.filter(
          (e) => !e.activityId || assignedActivityIds.includes(e.activityId),
        );

    return {
      events: filteredEvents,
      allEvents: allEvents,
    };
  }

  /**
   * Wrap an event entity with typed attendance/date/relatesTo/authors accessors
   * based on the configured field names for its event type.
   */
  private wrapEventEntity(entity: Entity): EventWithAttendance {
    const typeSettings = this.featureSettings.eventTypeSettings.find(
      (s) => s.eventType.ENTITY_TYPE === entity.getType(),
    );
    const attendanceField =
      AttendanceDatatype.detectFieldInEntity(entity) ?? "attendance";
    const dateField =
      typeSettings?.dateField ??
      DateDatatype.detectFieldInEntity(entity) ??
      "date";
    return new EventWithAttendance(
      entity,
      attendanceField,
      dateField,
      typeSettings?.relatesToField ?? "relatesTo",
      typeSettings?.assignedUsersField ?? "authors",
      typeSettings?.extraField ?? "",
    );
  }

  private async buildEventsFromActivities(
    activities: Entity[],
    existingEvents: Entity[],
    date: Date,
  ): Promise<EventWithAttendance[]> {
    const wrappedExisting = existingEvents.map((e) => this.wrapEventEntity(e));

    const newWrappedEvents = await Promise.all(
      activities.map(async (activity) => {
        const typeSettings = this.featureSettings.eventTypeSettings.find(
          (s) =>
            s.activityType !== undefined &&
            s.activityType.ENTITY_TYPE === activity.getType(),
        );
        const relatesToField = typeSettings?.relatesToField ?? "relatesTo";
        if (
          existingEvents.find((e) => e[relatesToField] === activity.getId())
        ) {
          return undefined;
        }
        return this.createEventForActivity(activity, date);
      }),
    );

    const allEvents = [
      ...wrappedExisting,
      ...newWrappedEvents.filter((e): e is EventWithAttendance => !!e),
    ];

    this.sortEventsByRelevance(allEvents, activities);
    return allEvents;
  }

  private sortEventsByRelevance(
    events: EventWithAttendance[],
    allActivities: Entity[],
  ): void {
    const calculatePriority = (event: EventWithAttendance): number => {
      let score = 0;

      const isActivity = event.isActivityEvent;
      const matchedActivity = isActivity
        ? allActivities.find((a) => a.getId() === event.activityId)
        : undefined;
      const activityAssignedUsers = matchedActivity
        ? this.getActivityAssignedUsers(matchedActivity)
        : undefined;
      // use parent activity's assigned users and only fall back to event if necessary
      const assignedUsers: string[] =
        activityAssignedUsers ?? event.assignedUsers;

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
    activity: Entity | string,
    date: Date,
  ): Promise<EventWithAttendance> {
    if (typeof activity === "string") {
      const activityTypeName = activity.split(":")[0];
      const typeSettings = this.featureSettings.eventTypeSettings.find(
        (s) =>
          s.activityType !== undefined &&
          s.activityType.ENTITY_TYPE === activityTypeName,
      );
      if (!typeSettings) {
        throw new Error(
          `No config found for activity type "${activityTypeName}"`,
        );
      }
      activity = await this.entityMapper.load(
        typeSettings.activityType!,
        activity,
      );
    }

    const typeSettings = this.featureSettings.eventTypeSettings.find(
      (s) =>
        s.activityType !== undefined &&
        s.activityType.ENTITY_TYPE === activity.getType(),
    );
    if (!typeSettings) {
      throw new Error(`No config found for activity "${activity.getId()}"`);
    }

    const instance = new typeSettings.eventType();

    // Set date
    const dateField =
      typeSettings.dateField ?? DateDatatype.detectFieldInEntity(instance);
    if (dateField) {
      instance[dateField] = date;
    }

    // Apply field mapping (activity[actField] → event[evField])
    for (const [evField, actField] of Object.entries(
      typeSettings.fieldMapping,
    )) {
      const value = activity[actField];
      instance[evField] =
        typeof value === "object" && value !== null
          ? structuredClone(value)
          : value;
    }

    // Resolve participants
    let participantIds: string[];
    if (
      this.featureSettings.groupBasedParticipants &&
      activity.getType() === "RecurringActivity"
    ) {
      participantIds =
        await this.groupParticipantResolver.getActiveParticipantsOfActivity(
          activity,
          date,
        );
    } else {
      participantIds =
        (activity[typeSettings.participantsField] as string[]) ?? [];
    }

    // Set attendance items
    const attendanceField = AttendanceDatatype.detectFieldInEntity(instance);
    if (attendanceField) {
      instance[attendanceField] = participantIds.map(
        (id) => new AttendanceItem(undefined, "", id),
      );
    }

    // Set relatesTo
    instance[typeSettings.relatesToField] = activity.getId();

    // Set authors
    if (this.currentUser.value) {
      instance[typeSettings.assignedUsersField] = [
        this.currentUser.value.getId(),
      ];
    }

    return new EventWithAttendance(
      instance,
      attendanceField ?? "attendance",
      dateField ?? "date",
      typeSettings.relatesToField,
      typeSettings.assignedUsersField,
      typeSettings.extraField,
    );
  }

  /**
   * Get the field name on an activity entity that holds assigned user IDs.
   * Falls back to "assignedTo" if no matching config is found.
   */
  private getActivityAssignedUsers(activity: Entity): string[] | undefined {
    const actType = activity.getType();
    for (const s of this.featureSettings.eventTypeSettings) {
      if (s.activityType?.ENTITY_TYPE === actType) {
        // try the configured event assignedUsersField on the activity as well
        const val = activity[s.assignedUsersField];
        if (Array.isArray(val)) return val;
      }
    }
    // fallback: check common field name
    return activity["assignedTo"] as string[] | undefined;
  }
}
