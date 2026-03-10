import { FilterConfig } from "#src/app/core/entity-list/EntityListConfig";
import { EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Configuration for a single activity-type → event-type mapping.
 * Used inside {@link AttendanceFeatureConfig.activityTypes}.
 */
export interface ActivityTypeConfig {
  /** Entity type name for the event entity to create (e.g. `"EventNote"`). */
  eventType: string;

  /**
   * Activity entity field holding the participant IDs to include in the event.
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
   * Defaults to `"relatesTo"`.
   */
  relatesToField?: string;

  /**
   * Event entity field name used to stamp the current user onto the created event.
   * Defaults to `"authors"`.
   */
  assignedUsersField?: string;

  /** Filter fields shown in the roll-call event selection UI. */
  filterConfig?: FilterConfig[];

  /** Extra field displayed on each event card in the roll-call UI. */
  extraField?: string;

  /**
   * Field mapping from event fields to activity fields, applied when creating a new event.
   * Keys are event entity field names, values are activity entity field names.
   *
   * Example: `{ "subject": "title", "category": "type" }` means
   * `event.subject = activity.title`.
   */
  fieldMapping?: { [eventField: string]: string };
}

/**
 * Resolved runtime shape of a single {@link ActivityTypeConfig} entry.
 * Type strings are resolved to `EntityConstructor` instances via the `EntityRegistry`.
 */
export interface ActivityTypeSettings {
  /** Constructor for the activity entity type. */
  activityType: EntityConstructor;

  /** Constructor for the event entity type to create. */
  eventType: EntityConstructor;

  /** Activity field holding participant IDs. */
  participantsField: string;

  /**
   * Override for the date field on the event entity.
   * `undefined` means auto-detect via `DateDatatype`.
   */
  dateField: string | undefined;

  /** Event field linking back to the parent activity. */
  relatesToField: string;

  /** Event field for stamping the current user. */
  assignedUsersField: string;

  /** Filter fields for the roll-call UI. */
  filterConfig: FilterConfig[];

  /** Extra field shown on each event card. */
  extraField: string;

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
   * Map of activity entity type names to their configuration.
   * Each entry maps an activity type to the event type it generates,
   * along with field mappings and UI configuration.
   *
   * Example:
   * ```json
   * {
   *   "RecurringActivity": {
   *     "eventType": "EventNote",
   *     "filterConfig": [{ "id": "category" }, { "id": "schools" }],
   *     "extraField": "category",
   *     "fieldMapping": { "subject": "title", "category": "type" }
   *   }
   * }
   * ```
   */
  activityTypes?: { [activityTypeName: string]: ActivityTypeConfig };

  /**
   * Enable legacy group-based participant resolution:
   * when true, participants linked via schools/groups are included
   * in the attendance overview in addition to direct participants.
   *
   * @deprecated Prefer adding participants directly to the activity.
   */
  groupBasedParticipants?: boolean;
}

/**
 * Runtime shape exposed by {@link AttendanceService.featureSettings}.
 * Entity type names are resolved to constructors via EntityRegistry on service initialisation.
 */
export interface AttendanceFeatureSettings {
  /** Full settings for each configured activity type → event type mapping. */
  activityTypes: ActivityTypeSettings[];

  /**
   * Entity constructors of all configured activity types.
   * Derived from `activityTypes` for consumers like permission guards and index creation.
   */
  recurringActivityTypes: EntityConstructor[];

  /**
   * Entity constructors of all configured event types.
   * Derived from `activityTypes` for consumers like permission guards and index creation.
   */
  eventTypes: EntityConstructor[];

  /**
   * Merged filter configuration from all activity type configs.
   * Used as the default for the roll-call UI filter.
   */
  filterConfig: FilterConfig[];

  /**
   * Whether legacy group-based participant resolution is active.
   * @see {@link AttendanceFeatureConfig.groupBasedParticipants}
   */
  groupBasedParticipants?: boolean;
}
