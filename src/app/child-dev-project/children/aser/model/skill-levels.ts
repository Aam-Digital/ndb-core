import {
  ConfigurableEnumConfig,
  EMPTY,
} from "../../../../core/configurable-enum/configurable-enum.interface";
import { Ordering } from "../../../../core/configurable-enum/configurable-enum-ordering";

export type SkillLevel = Ordering.EnumValue & { passed?: boolean };

export const readingLevels: ConfigurableEnumConfig<SkillLevel> =
  Ordering.imposeTotalOrdering([
    EMPTY,
    {
      id: "Nothing",
      label: $localize`:Label reading level:Nothing`,
    },
    {
      id: "Read Letters",
      label: $localize`:Label reading level:Read Letters`,
    },
    {
      id: "Read Words",
      label: $localize`:Label reading level:Read Words`,
    },
    {
      id: "Read Sentence",
      label: $localize`:Label reading level:Read Sentence`,
    },
    {
      id: "Read Paragraph",
      label: $localize`:Label reading level:Read Paragraph`,
      passed: true,
    },
  ]);

export const mathLevels: ConfigurableEnumConfig<SkillLevel> =
  Ordering.imposeTotalOrdering([
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
      passed: true,
    },
  ]);
