import {
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
  EMPTY,
} from "../../../core/configurable-enum/configurable-enum.interface";

export type MathLevel = ConfigurableEnumValue;
export const mathLevels: ConfigurableEnumConfig<MathLevel> = [
  EMPTY,
  {
    id: "Nothing",
    label: $localize`:Label math level:Nothing`,
  },
  {
    id: "Numbers 1-9",
    label: $localize`:Label math level:Numbers 1-9`,
  },
  {
    id: "Numbers 10-99",
    label: $localize`:Label math level:Numbers 10-99`,
  },
  {
    id: "Subtraction",
    label: $localize`:Label math level:Subtraction`,
  },
  {
    id: "Division",
    label: $localize`:Label math level:Division`,
  },
];
