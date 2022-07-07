import { ConfigurableEnumValue } from "../core/configurable-enum/configurable-enum.interface";
import { EnumOrdering } from "../core/configurable-enum/configurable-enum-ordering";

export const warningLevels: ConfigurableEnumValue[] =
  EnumOrdering.imposeTotalOrdering([
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
  ]);
