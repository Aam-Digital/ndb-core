import { ConfigurableEnumValue } from "../../../configurable-enum/configurable-enum.interface";

/**
 * An enhanced sortingDataAccessor function that can be set for a MatTableDataSource
 * in order to support sorting by ConfigurableEnum columns and other Entity specific values.
 *
 * @param value the object for which a readable string should be returned
 */
export function getReadableValue(value: any): any {
  if (isConfigurableEnum(value)) {
    return value.label;
  } else if (Array.isArray(value)) {
    if (value.length > 0 && value.every((val) => value.indexOf(val) === 0)) {
      // only return a single value if all elements in array are same
      return getReadableValue(value[0]);
    } else {
      return value.map((v) => getReadableValue(v));
    }
  } else {
    return value;
  }
}

function isConfigurableEnum(value: any): value is ConfigurableEnumValue {
  return typeof value === "object" && value && "label" in value;
}
