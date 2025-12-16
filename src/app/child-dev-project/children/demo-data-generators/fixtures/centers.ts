import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import enums from "../../../../../assets/base-configs/all-features/configurable-enums.json";

export const centersUnique: ConfigurableEnumValue[] = enums.find(
  (e) => e._id === "ConfigurableEnum:center",
).values;

// multiple entries for the same value increase its probability
export const centersWithProbability = [0, 0, 1, 2].map((i) => centersUnique[i]);
