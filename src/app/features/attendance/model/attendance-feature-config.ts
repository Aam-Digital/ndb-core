import { FilterConfig } from "#src/app/core/entity-list/EntityListConfig";
import { EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Configuration for a single event type entry.
 * When `activityType` is set, events are generated from recurring activities of that type.
 * When `activityType` is omitted, the event type is standalone — entities are created manually
 * and appear in the roll-call setup via existing event queries.
 *
 * Used inside {@link AttendanceFeatureConfig.eventTypes}.
 */
export interface EventTypeConfig {
  /** Entity type for the event entity to create */
  eventType: string;

  /**
   * Entity type for the activity entity.
   * When set, events are auto-generated from activities of this type.
   * When omitted, this is a standalone event type.
   */
  activityType?: string;

  /**
   * Activity entity field holding the participant IDs to include in the event.
   * Only relevant when `activityType` is set.
   * Defaults to `"participants"`.
   */
  participantsField?: string;

  /**
   * Override the auto-detected date field on the event entity.
   * If omitted, the date field is detected via the `DateDatatype` schema annotation.
   */
  dateField?: string;

  /**
   * Event entity field name used to link the event back to its parent activity.
   * Only relevant when `activityType` is set.
   * Defaults to `"relatesTo"`.
   */
  relatesToField?: string;

  /**
   * Override the auto-detected attendance field on the event entity.
   * If omitted, the attendance field is detected via the `AttendanceDatatype` schema annotation.
   */
  attendanceField?: string;

  /**
   * Event entity field name used to stamp the current user onto the created event.
   * Defaults to `"authors"`.
   */
  eventAssignedUsersField?: string;

  /**
   * Activity entity field holding assigned user IDs.
   * Used to filter and sort events by the current user's activity assignments.
   * If omitted, activity-level user assignment is not used.
   */
  activityAssignedUsersField?: string;

  /** Filter fields shown in the roll-call event selection UI. */
  filterConfig?: FilterConfig[];

  /** Extra field displayed on each event card in the roll-call UI. */
  extraField?: string;

  /**
   * Field mapping from event fields to activity fields, applied when creating a new event.
   * Only relevant when `activityType` is set.
   * Keys are event entity field names, values are activity entity field names.
   *
   * Example: `{ "subject": "title", "category": "type" }` means
   * `event.subject = activity.title`.
   */
  fieldMapping?: { [eventField: string]: string };
}

/**
 * Resolved runtime shape of a single {@link EventTypeConfig} entry.
 * Type strings are resolved to `EntityConstructor` instances via the `EntityRegistry`.
 */
export interface EventTypeSettings {
  /**
   * Constructor for the activity entity type.
   * `undefined` for standalone event types (no linked activity).
   */
  activityType: EntityConstructor | undefined;

  /** Constructor for the event entity type to create. */
  eventType: EntityConstructor;

  /** Activity field holding participant IDs. */
  participantsField: string;

  /**
   * Event entity field holding the attendance data.
   * Resolved at config time: explicit config > schema detection > `"attendance"` fallback.
   */
  attendanceField: string;

  /**
   * Event entity field holding the date.
   * Resolved at config time: explicit config > schema detection.
   * `undefined` if no date field could be determined (a warning is logged).
   */
  dateField: string | undefined;

  /** Event field linking back to the parent activity. */
  relatesToField: string;

  /** Event field for stamping the current user. */
  eventAssignedUsersField: string;

  /**
   * Activity field holding assigned user IDs.
   * `undefined` means activity-level user assignment is not used.
   */
  activityAssignedUsersField: string | undefined;

  /** Filter fields for the roll-call UI. */
  filterConfig: FilterConfig[];

  /** Extra field shown on each event card. `undefined` if not configured. */
  extraField: string | undefined;

  /** Field mapping: event field ← activity field. */
  fieldMapping: { [eventField: string]: string };
}

/**
 * Raw JSON shape stored in the Config entity.
 * All fields are optional — AttendanceService applies defaults for any missing values.
 *
 * Store this under the key {@link AttendanceService.CONFIG_KEY} (`"appConfig:attendance"`).
 */
export interface AttendanceFeatureConfig {
  /**
   * Array of event type configurations.
   * Each entry defines an event type and optionally links it to an activity type.
   *
   * Entries with `activityType` generate events from recurring activities.
   * Entries without `activityType` define standalone event types
   * whose entities are created manually and appear in the roll-call setup.
   *
   * Example:
   * ```json
   * [
   *   {
   *     "activityType": "RecurringActivity",
   *     "eventType": "Event",
   *     "filterConfig": [{ "id": "category" }, { "id": "schools" }],
   *     "extraField": "category",
   *     "fieldMapping": { "subject": "title", "category": "type" }
   *   },
   *   {
   *     "eventType": "HomeVisit"
   *   }
   * ]
   * ```
   */
  eventTypes?: EventTypeConfig[];
}
