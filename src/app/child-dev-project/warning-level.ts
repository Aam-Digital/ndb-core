import { Ordering } from "../core/basic-datatypes/configurable-enum/configurable-enum-ordering";

export enum WarningLevel {
  WARNING = "WARNING",
  URGENT = "URGENT",
  OK = "OK",
  NONE = "",
}

export function getWarningLevelColor(warningLevel: WarningLevel) {
  switch (warningLevel) {
    case WarningLevel.WARNING:
      return "rgba(255,165,0,0.4)";
    case WarningLevel.URGENT:
      return "rgba(253,114,114,0.4)";
    case WarningLevel.OK:
      return "rgba(144,238,144,0.25)";
    default:
      return "";
  }
}

export const warningLevels: Ordering.EnumValue[] = Ordering.imposeTotalOrdering(
  [
    {
      id: "",
      label: "",
    },
    {
      id: "OK",
      label: $localize`:Label warning level:Solved`,
    },
    {
      id: "WARNING",
      label: $localize`:Label warning level:Needs Follow-Up`,
    },
    {
      id: "URGENT",
      label: $localize`:Label warning level:Urgent Follow-Up`,
    },
  ],
);
