import { ConfigurableEnumValue } from "../../basic-datatypes/configurable-enum/configurable-enum.types";
import enums from "../../../../assets/base-configs/education/configurable-enums.json";

export const ACTIVITY_STATUS_ENUM = "activity-status";

export const defaultActivityStatus: ConfigurableEnumValue[] = enums.find(
  (e) => e._id === "ConfigurableEnum:" + ACTIVITY_STATUS_ENUM,
).values;
