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
): OBJECT[PROPERTY] | string {
  if (isConfigurableEnum(data, key)) {
    return (data[key] as any).label;
  } else {
    return data[key];
  }
}

function isConfigurableEnum<OBJECT, PROPERTY extends keyof OBJECT>(
  data: OBJECT,
  key: PROPERTY
): boolean {
  return typeof data[key] === "object" && data[key] && "label" in data[key];
}
