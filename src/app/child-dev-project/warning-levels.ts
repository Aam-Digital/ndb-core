import { ConfigurableEnumValue } from "../core/configurable-enum/configurable-enum.interface";

export const warningLevels: ConfigurableEnumValue[] = [
  {
    id: "",
    label: "",
  },
  {
    id: "OK",
    label: "Solved",
  },
  {
    id: "WARNING",
    label: "Needs Follow-Up",
  },
  {
    id: "URGENT",
    label: "Urgent Follow-Up",
  },
];
