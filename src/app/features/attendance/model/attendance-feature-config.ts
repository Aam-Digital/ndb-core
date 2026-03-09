import { FilterConfig } from "#src/app/core/entity-list/EntityListConfig";
import { EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Configuration for the roll-call event selection UI.
 */
export interface AttendanceFeatureConfig {
  rollCallSetup: {
    /** Filter fields for the roll-call event selection UI. */
    filterConfig?: FilterConfig[];

    /** Extra field shown on each event card in the roll-call UI. */
    extraField: string;
  };

  /**
   * Entity types that can serve as a template to create a new roll-call event for a specific date.
   */
  recurringActivityTypes: EntityConstructor[];

  /**
   * Entity types that can be created from a recurring activity or as a one-time roll-call event.
   */
  eventTypes: EntityConstructor[];
}
