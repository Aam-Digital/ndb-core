import { FilterConfig } from "#src/app/core/entity-list/EntityListConfig";
import { EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Raw JSON shape stored in the Config entity.
 * All fields are optional — AttendanceService applies defaults for any missing values.
 *
 * Store this under the key {@link AttendanceService.CONFIG_KEY} (`"appConfig:attendance"`).
 */
export interface AttendanceFeatureConfig {
  rollCallSetup?: {
    /** Filter fields for the roll-call event selection UI. */
    filterConfig?: FilterConfig[];
    /** Extra field shown on each event card in the roll-call UI. */
    extraField?: string;
  };

  /**
   * Entity type names (e.g. `"RecurringActivity"`) that serve as templates
   * to create a new roll-call event for a specific date.
   */
  recurringActivityTypes?: string[];

  /**
   * Entity type names (e.g. `"EventNote"`) that can be created
   * from a recurring activity or as a one-time roll-call event.
   */
  eventTypes?: string[];
}

/**
 * Runtime shape exposed by {@link AttendanceService.featureSettings}.
 * Entity type names from {@link AttendanceFeatureConfig} are resolved to constructors
 * via EntityRegistry on service initialisation.
 */
export interface AttendanceFeatureSettings {
  rollCallSetup: {
    /** Filter fields for the roll-call event selection UI. */
    filterConfig: FilterConfig[];
    /** Extra field shown on each event card in the roll-call UI. */
    extraField: string;
  };

  /**
   * Entity constructors that can serve as templates
   * to create a new roll-call event for a specific date.
   */
  recurringActivityTypes: EntityConstructor[];

  /**
   * Entity constructors that can be created
   * from a recurring activity or as a one-time roll-call event.
   */
  eventTypes: EntityConstructor[];
}
