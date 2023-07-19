import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";

/**
 * logical type of an attendance status, i.e. how it will be considered for statistics and analysis.
 */
export enum AttendanceLogicalStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  IGNORE = "IGNORE",
}

/**
 * the id through which the available attendance status types can be loaded from the ConfigService.
 */
export const ATTENDANCE_STATUS_CONFIG_ID = "attendance-status";

/**
 * Details of one status option users can assign to a participant's details attending an event.
 */
export interface AttendanceStatusType extends ConfigurableEnumValue {
  /** persistent id that remains unchanged in the config database */
  id: string;

  /** a clear, spelled out title of the status */
  label: string;

  /** a short (one letter) representation e.g. used in calendar view */
  shortName: string;

  /**
   * how this status will be categorized and considered for statistics and analysis
   */
  countAs: AttendanceLogicalStatus;

  /** a css class with styling related to the status */
  style?: string;
}

/**
 * Null object representing an unknown attendance status.
 *
 * This allows easier handling of attendance status logic because exceptional checks for undefined are not necessary.
 */
export const NullAttendanceStatusType: AttendanceStatusType = {
  id: "",
  label: "",
  shortName: "",
  countAs: AttendanceLogicalStatus.IGNORE,
};
