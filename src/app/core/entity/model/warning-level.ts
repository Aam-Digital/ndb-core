export enum WarningLevel {
  WARNING = "WARNING",
  URGENT = "URGENT",
  OK = "OK",
  NONE = "",
}

export function getWarningLevelColor(warningLevel: WarningLevel) {
  switch (warningLevel) {
    case WarningLevel.WARNING:
      return "#ffa50080";
    case WarningLevel.URGENT:
      return "#fd727280";
    case WarningLevel.OK:
      return "#90ee9040";
    default:
      return "";
  }
}
