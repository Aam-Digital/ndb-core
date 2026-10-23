import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import demoEnums from "app/core/demo-data/demo-enums.json";

// kept separate from the shipped config, whose texts can be configured per language
export const centersUnique: ConfigurableEnumValue[] = demoEnums.find(
  (e) => e._id === "ConfigurableEnum:center",
).values;

// multiple entries for the same value increase its probability
export const centersWithProbability = [0, 0, 1, 2].map((i) => centersUnique[i]);
