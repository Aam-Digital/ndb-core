import {
  ConfigurableEnumConfig,
  EMPTY,
} from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.interface";
import { Ordering } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum-ordering";

export type SkillLevel = Ordering.EnumValue & { passed?: boolean };

export const readingLevels: ConfigurableEnumConfig<SkillLevel> =
  Ordering.imposeTotalOrdering([
    EMPTY,
    {
      id: "Nothing",
      label: $localize`:Label reading level:Nothing`,
      color: "#fd7272",
    },
    {
      id: "Read Letters",
      label: $localize`:Label reading level:Read Letters`,
      color: "#ff8153",
    },
    {
      id: "Read Words",
      label: $localize`:Label reading level:Read Words`,
      color: "#ff982a",
    },
    {
      id: "Read Sentence",
      label: $localize`:Label reading level:Read Sentence`,
      color: "#d2c92e",
    },
    {
      id: "Read Paragraph",
      label: $localize`:Label reading level:Read Paragraph`,
      passed: true,
      color: "#90ee90",
    },
  ]);

export const mathLevels: ConfigurableEnumConfig<SkillLevel> =
  Ordering.imposeTotalOrdering([
    EMPTY,
    {
      id: "Nothing",
      label: $localize`:Label math level:Nothing`,
      color: "#fd7272",
    },
    {
      id: "Numbers 1-9",
      label: $localize`:Label math level:Numbers 1-9`,
      color: "#ff8153",
    },
    {
      id: "Numbers 10-99",
      label: $localize`:Label math level:Numbers 10-99`,
      color: "#ff982a",
    },
    {
      id: "Subtraction",
      label: $localize`:Label math level:Subtraction`,
      color: "#d2c92e",
    },
    {
      id: "Division",
      label: $localize`:Label math level:Division`,
      passed: true,
      color: "#c8e6c9",
    },
  ]);
