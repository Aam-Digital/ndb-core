import {
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
  EMPTY,
} from "../../../core/configurable-enum/configurable-enum.interface";

export type ReadingLevel = ConfigurableEnumValue;
export const readingLevels: ConfigurableEnumConfig<ReadingLevel> = [
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
  },
];
