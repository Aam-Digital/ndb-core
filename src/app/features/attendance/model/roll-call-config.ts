import { FilterConfig } from "#src/app/core/entity-list/EntityListConfig";

/**
 * Configuration for the roll-call event selection UI.
 */
export interface RollCallConfig {
  /** Filter fields for the roll-call event selection UI. */
  filterConfig: FilterConfig[];

  /** Extra field shown on each event card in the roll-call UI. */
  extraField: string;

  /** Field name used to read the date from an event entity in the roll-call UI. */
  dateField: string;
}
