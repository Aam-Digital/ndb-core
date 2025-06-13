import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import enums from "../../../../../assets/base-configs/education/configurable-enums.json";

export const materials: ConfigurableEnumValue[] = enums.find(
  (e) => e._id === "ConfigurableEnum:materials",
).values;
