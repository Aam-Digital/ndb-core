import { ConfigurableEnumValue } from "../core/configurable-enum/configurable-enum.interface";

export const warningLevels: ConfigurableEnumValue[] = [
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
];
