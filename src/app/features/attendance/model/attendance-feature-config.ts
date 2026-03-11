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
  /** Entity type name for the event entity to create (e.g. `"EventNote"`). */
  eventType: string;

  /**
   * Entity type name for the activity entity (e.g. `"RecurringActivity"`).
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
   *     "eventType": "EventNote",
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
  /** Full settings for each configured event type. */
  eventTypeSettings: EventTypeSettings[];

  /**
   * Entity constructors of all configured activity types (only entries with an activityType).
   * Derived from `eventTypeSettings` for consumers like permission guards and index creation.
   */
  recurringActivityTypes: EntityConstructor[];

  /**
   * Entity constructors of all configured event types.
   * Derived from `eventTypeSettings` for consumers like permission guards and index creation.
   */
  eventTypes: EntityConstructor[];

  /**
   * Merged filter configuration from all event type configs.
   * Used as the default for the roll-call UI filter.
   */
  filterConfig: FilterConfig[];

  /**
   * Whether legacy group-based participant resolution is active.
   * @see {@link AttendanceFeatureConfig.groupBasedParticipants}
   */
  groupBasedParticipants?: boolean;
}
