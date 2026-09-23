import { ConfigurableEnumValue } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.types";
import demoEnums from "../../../../core/demo-data/demo-enums.json";

// kept separate from the shipped config, whose texts can be configured per language
export const ratingAnswers: ConfigurableEnumValue[] = demoEnums.find(
  (e) => e._id === "ConfigurableEnum:rating-answer",
).values;
