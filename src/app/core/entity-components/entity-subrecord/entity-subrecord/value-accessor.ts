import { ConfigurableEnumValue } from "../../../configurable-enum/configurable-enum.interface";

/**
 * An enhanced sortingDataAccessor function that can be set for a MatTableDataSource
 * in order to support sorting by ConfigurableEnum columns and other Entity specific values.
 *
 * @param data The object (table row); passed in by the data source
 * @param key The active sorting header key; passed in by the data source
 */
export function getReadableValue<OBJECT, PROPERTY extends keyof OBJECT>(
  data: OBJECT,
  key: PROPERTY
): any {
  const value = data[key];
  if (isConfigurableEnum(value)) {
    return value.label;
  } else if (Array.isArray(value)) {
    return value.map((v) => getReadableValue({ v }, "v"));
  } else {
    return value;
  }
}

function isConfigurableEnum(value: any): value is ConfigurableEnumValue {
  return typeof value === "object" && value && "label" in value;
}
