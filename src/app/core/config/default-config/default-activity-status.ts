import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.types";

export const ACTIVITY_STATUS_ENUM = "activity-status";

export const defaultActivityStatus: ConfigurableEnumValue[] = [
  {
    id: "PLANNED",
    label: $localize`:Activity Status option:Planned`,
  },
  {
    id: "ONGOING",
    label: $localize`:Activity Status option:Ongoing`,
  },
  {
    id: "COMPLETED",
    label: $localize`:Activity Status option:Completed`,
  },
];
