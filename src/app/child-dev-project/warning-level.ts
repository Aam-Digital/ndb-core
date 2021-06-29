import { ConfigurableEnumValue } from "../core/configurable-enum/configurable-enum.interface";

export const warningLevels: ConfigurableEnumValue[] = [
  {
    id: "",
    label: "None",
    color: "",
  },
  {
    id: "OK",
    label: "OK",
    color: "#90ee9040",
  },
  {
    id: "WARNING",
    label: "WARNING",
    color: "#ffa50080",
  },
  {
    id: "URGENT",
    label: "URGENT",
    color: "#fd727280",
  },
];
