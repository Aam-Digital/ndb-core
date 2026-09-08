import { Ordering } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum-ordering";
import { ConfigurableEnumConfig } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.types";
import demoEnums from "../../../../core/demo-data/demo-enums.json";

export type SkillLevel = Ordering.EnumValue & { passed?: boolean };

// kept separate from the shipped config, whose texts can be configured per language
export const readingLevels: ConfigurableEnumConfig<SkillLevel> = demoEnums.find(
  (e) => e._id === "ConfigurableEnum:reading-levels",
).values;

export const mathLevels: ConfigurableEnumConfig<SkillLevel> = demoEnums.find(
  (e) => e._id === "ConfigurableEnum:math-levels",
).values;
