import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import demoEnums from "app/core/demo-data/demo-enums.json";

// kept separate from the shipped config, whose texts can be configured per language
export const genders: ConfigurableEnumValue[] = demoEnums.find(
  (e) => e._id === "ConfigurableEnum:genders",
).values;
