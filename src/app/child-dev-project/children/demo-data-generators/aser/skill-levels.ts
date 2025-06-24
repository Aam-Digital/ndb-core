import { Ordering } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum-ordering";
import { ConfigurableEnumConfig } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.types";
import enums from "../../../../../assets/base-configs/education/configurable-enums.json";

export type SkillLevel = Ordering.EnumValue & { passed?: boolean };

export const readingLevels: ConfigurableEnumConfig<SkillLevel> = enums.find(
  (e) => e._id === "ConfigurableEnum:reading-levels",
).values;

export const mathLevels: ConfigurableEnumConfig<SkillLevel> = enums.find(
  (e) => e._id === "ConfigurableEnum:math-levels",
).values;
